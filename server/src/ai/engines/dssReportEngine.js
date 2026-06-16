const fs = require('fs');
const path = require('path');
const { prisma } = require('../../infrastructure/database/prisma');
const { calculateBaseRisk, getRiskLevel } = require('./riskEngine');
const { calculateFptGPA, getCourseCredits, calculateDelayScore } = require('../../utils/dataService');

// Helper to load JSON from server/data/knowledge
function loadKnowledgeJson(filename) {
  try {
    const p = path.join(__dirname, '..', '..', '..', 'data', 'knowledge', filename);
    if (fs.existsSync(p)) {
      return JSON.parse(fs.readFileSync(p, 'utf8'));
    }
  } catch (e) {
    console.warn(`[dssReportEngine] Failed to load ${filename}:`, e.message);
  }
  return {};
}

// Load static knowledge graphs
const syllabusGraph = loadKnowledgeJson('syllabus_graph.json');
const courseDependency = loadKnowledgeJson('course_dependency.json');
const coursesJson = loadKnowledgeJson('courses.json');
const courseCentrality = loadKnowledgeJson('course-centrality.json');

const curriculumKbRaw = loadKnowledgeJson('curriculum_knowledge_base.json');
const curriculumKb = Array.isArray(curriculumKbRaw) ? curriculumKbRaw : [];
const courseSkillGraph = loadKnowledgeJson('course_skill_graph.json');
const courseCareerMapping = loadKnowledgeJson('course_career_mapping.json');
const courseInterventionRules = loadKnowledgeJson('course_intervention_rules.json');

// Module-level caches to prevent O(N^2) DB bottlenecks during batch queries
let cachedStudentGpas = null;
let lastCacheTime = 0;
let cachedCourseStats = null;
let lastCourseStatsTime = 0;
const CACHE_DURATION = 60000; // 1 minute cache

// Helper to convert semester name to sortable float
function getSemesterVal(semStr) {
  const lower = (semStr || '').toLowerCase();
  const match = lower.match(/\d+/);
  const year = match ? parseInt(match[0]) : 2025;
  let term = 0.2; // Spring
  if (lower.includes('summer')) term = 0.5;
  if (lower.includes('fall')) term = 0.8;
  return year + term;
}

/**
 * Generate 9-part Academic DSS Report for a single student
 */
async function generateDetailedDSSReport(student) {
  if (!student) return null;
  const scores = student.scores || [];
  const gradedScores = scores.filter(s => s.value !== null);
  if (gradedScores.length === 0) {
    return {
      academicHealth: {
        score: 'N/A',
        rating: 'Chưa đủ dữ liệu để đánh giá',
        description: 'Sinh viên chưa có điểm môn học nào trong hệ thống để tính toán chỉ số sức khỏe học tập.',
        cohortRank: '—',
        totalCohort: '—',
        cohortPercentile: '—'
      },
      trendAnalysis: {
        trendData: [],
        status: 'Không khả dụng',
        explanation: 'Chưa có dữ liệu điểm để phân tích xu hướng học tập.'
      },
      knowledgeDependency: {
        failedCourses: [],
        blockedCourses: []
      },
      rootCauseAnalysis: null,
      riskContributors: [],
      futureCourseImpact: [],
      graduationRisk: {
        level: 'Chưa khả dụng',
        description: 'Chưa có dữ liệu học tập để đánh giá nguy cơ chậm tốt nghiệp.',
        delaySemesters: 0,
        delayScore: 0
      },
      recoveryRoadmap: [],
      interventionRecommendation: {
        riskLevel: 'N/A',
        actionCode: 'NO_DATA',
        actionTitle: 'Chưa khả dụng',
        description: 'Chưa có dữ liệu điểm để đưa ra đề xuất can thiệp.',
        colorClass: 'slate'
      },
      programLevelComparison: []
    };
  }

  const predictions = student.predictions || [];

  // Calculate Base Risk
  const baseRisk = calculateBaseRisk(student);

  // 1. Calculate Cohort Percentile (Rank across all 652 students in DB)
  let rank = 1;
  let totalCohort = 1;
  let cohortPercentile = 100.0;
  try {
    const now = Date.now();
    let studentGpas = cachedStudentGpas;
    if (!studentGpas || now - lastCacheTime > CACHE_DURATION) {
      const allStudents = await prisma.student.findMany({ include: { scores: true } });
      studentGpas = allStudents.map(st => {
        const stScores = st.scores || [];
        const stats = calculateFptGPA(stScores);
        return { mssv: st.mssv, gpa: stats.gpa };
      });
      studentGpas.sort((a, b) => b.gpa - a.gpa);
      cachedStudentGpas = studentGpas;
      lastCacheTime = now;
    }
    totalCohort = studentGpas.length;
    const foundIdx = studentGpas.findIndex(s => s.mssv === student.mssv);
    rank = foundIdx !== -1 ? foundIdx + 1 : 1;
    cohortPercentile = totalCohort > 0 ? Math.round((rank / totalCohort) * 100 * 10) / 10 : 100.0;
  } catch (err) {
    console.error('[dssReportEngine] Failed to calculate cohort rank:', err);
  }

  // 2. Trend Analysis (GPA over semesters)
  const completedScores = scores.filter(s => s.value !== null && (s.status === 'PASSED' || s.status === 'FAILED'));
  const semesterGroups = {};
  completedScores.forEach(s => {
    const sem = s.semester || 'Summer 2025';
    if (!semesterGroups[sem]) semesterGroups[sem] = [];
    semesterGroups[sem].push(s);
  });

  const sortedSemesters = Object.keys(semesterGroups).sort((a, b) => getSemesterVal(a) - getSemesterVal(b));
  const trendData = sortedSemesters.map(sem => {
    const semScores = semesterGroups[sem];
    const stats = calculateFptGPA(semScores);
    return {
      semester: sem,
      gpa: stats.gpa
    };
  });

  let trendStatus = 'Ổn định ➡️';
  let trendExplanation = 'Phong độ học tập được duy trì ổn định qua các học kỳ.';
  if (trendData.length >= 2) {
    const lastGpa = trendData[trendData.length - 1].gpa;
    const prevGpa = trendData[trendData.length - 2].gpa;
    const diff = lastGpa - prevGpa;

    // Check continuous decline if we have >= 3 points
    let isContinuousDecline = false;
    if (trendData.length >= 3) {
      const gpa3 = trendData[trendData.length - 3].gpa;
      if (lastGpa < prevGpa && prevGpa < gpa3) {
        isContinuousDecline = true;
      }
    }

    if (isContinuousDecline) {
      trendStatus = 'Suy giảm liên tục 📉';
      trendExplanation = 'GPA liên tục tụt dốc qua 3 học kỳ gần nhất. Đây là dấu hiệu mất gốc học thuật nghiêm trọng.';
    } else if (diff < -0.5) {
      trendStatus = 'Suy giảm nhanh 📉';
      trendExplanation = `GPA học kỳ gần nhất giảm mạnh ${Math.abs(diff).toFixed(1)} điểm so với học kỳ trước.`;
    } else if (diff > 0.5) {
      trendStatus = 'Phát triển tăng tiến 📈';
      trendExplanation = `GPA có sự cải thiện rõ rệt, tăng ${diff.toFixed(1)} điểm so với học kỳ trước.`;
    }
  }

  // 3. Knowledge Dependency Analysis
  const failedCourses = scores.filter(s => s.status === 'FAILED' || (s.value !== null && s.value < 5.0)).map(s => s.courseId);
  const blockedCourses = [];
  failedCourses.forEach(fc => {
    // Check local syllabus_graph
    const node = syllabusGraph[fc];
    if (node && node.unlocks) {
      node.unlocks.forEach(unlock => {
        if (!blockedCourses.includes(unlock)) {
          blockedCourses.push({
            failedCourse: fc,
            failedCourseName: node.name,
            blockedCourse: unlock,
            blockedCourseName: syllabusGraph[unlock]?.name || unlock
          });
        }
      });
    }

    // Check courseDependency
    const depNode = courseDependency[fc];
    if (depNode && depNode.affects) {
      depNode.affects.forEach(affect => {
        if (!blockedCourses.some(bc => bc.blockedCourse === affect)) {
          blockedCourses.push({
            failedCourse: fc,
            failedCourseName: depNode.role || fc,
            blockedCourse: affect,
            blockedCourseName: courseDependency[affect]?.role || affect
          });
        }
      });
    }
  });

  // 4. Root Cause Analysis (Prerequisite Knowledge Graph Traversal)
  // Traces back to the earliest prerequisite ancestor in the syllabus graph (syllabus_graph.json)
  // using graph-based priority scoring.
  const getSourceAncestor = (courseId, visited = new Set()) => {
    if (visited.has(courseId)) return courseId;
    visited.add(courseId);
    
    const node = syllabusGraph[courseId];
    const kbCourse = curriculumKb.find(kb => kb.courseId.toLowerCase().replace(/\s+/g, '') === courseId.toLowerCase().replace(/\s+/g, ''));
    const prerequisites = (node && node.prerequisites) || (kbCourse && kbCourse.prerequisiteCourses) || [];
    if (prerequisites.length === 0) {
      return courseId;
    }
    
    for (const prereq of prerequisites) {
      const pScoreObj = scores.find(s => {
        const cleanP = prereq.toLowerCase().replace(/\s+/g, '');
        const cleanS = s.courseId.toLowerCase().replace(/\s+/g, '');
        return cleanS === cleanP || cleanS.includes(cleanP) || cleanP.includes(cleanS);
      });
      if (pScoreObj && (pScoreObj.status === 'FAILED' || (pScoreObj.value !== null && pScoreObj.value < 7.0))) {
        return getSourceAncestor(prereq, visited);
      }
    }
    
    return courseId;
  };

  const getDownstreamCount = (cId) => {
    const visited = new Set();
    const queue = [cId];
    const descendants = new Set();
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
      const node = syllabusGraph[current];
      if (node && node.unlocks) {
        node.unlocks.forEach(unlock => {
          descendants.add(unlock);
          queue.push(unlock);
        });
      }
      const depNode = courseDependency[current];
      if (depNode && depNode.affects) {
        depNode.affects.forEach(affect => {
          descendants.add(affect);
          queue.push(affect);
        });
      }
      const kbCourse = curriculumKb.find(kb => kb.courseId.toLowerCase().replace(/\s+/g, '') === current.toLowerCase().replace(/\s+/g, ''));
      if (kbCourse && kbCourse.affectedCourses) {
        kbCourse.affectedCourses.forEach(affect => {
          descendants.add(affect);
          queue.push(affect);
        });
      }
    }
    return descendants.size;
  };

  const getFutureDownstreamCourses = (cId) => {
    const visited = new Set();
    const queue = [cId];
    while (queue.length > 0) {
      const current = queue.shift();
      if (visited.has(current)) continue;
      visited.add(current);
      
      const node = syllabusGraph[current];
      if (node && node.unlocks) {
        node.unlocks.forEach(unlock => {
          if (!visited.has(unlock) && !queue.includes(unlock)) {
            queue.push(unlock);
          }
        });
      }
      const depNode = courseDependency[current];
      if (depNode && depNode.affects) {
        depNode.affects.forEach(affect => {
          if (!visited.has(affect) && !queue.includes(affect)) {
            queue.push(affect);
          }
        });
      }
      const kbCourse = curriculumKb.find(kb => kb.courseId.toLowerCase().replace(/\s+/g, '') === current.toLowerCase().replace(/\s+/g, ''));
      if (kbCourse && kbCourse.affectedCourses) {
        kbCourse.affectedCourses.forEach(affect => {
          if (!visited.has(affect) && !queue.includes(affect)) {
            queue.push(affect);
          }
        });
      }
    }
    
    // Remove the starting course itself
    visited.delete(cId);
    
    // Filter out finished courses
    const futureDownstream = [];
    visited.forEach(id => {
      const sc = scores.find(s => s.courseId === id);
      const isFinished = sc && (sc.status === 'PASSED' || sc.status === 'FAILED');
      if (!isFinished) {
        const dKb = curriculumKb.find(kb => kb.courseId.toLowerCase().replace(/\s+/g, '') === id.toLowerCase().replace(/\s+/g, ''));
        const dName = dKb ? dKb.courseName : (syllabusGraph[id]?.name || id);
        futureDownstream.push({ courseId: id, name: dName });
      }
    });
    
    return futureDownstream;
  };

  // Collect all troubled courses in student scores (failed or weak)
  const troubledCourses = scores.filter(s => s.status === 'FAILED' || (s.value !== null && s.value < 7.0));
  
  let rootCause = null;
  if (troubledCourses.length > 0) {
    const candidatesMap = new Map();
    troubledCourses.forEach(s => {
      const ancestorId = getSourceAncestor(s.courseId);
      const ancestorScoreObj = scores.find(as => as.courseId === ancestorId);
      if (ancestorScoreObj) {
        candidatesMap.set(ancestorId, ancestorScoreObj);
      }
    });
    
    const candidates = Array.from(candidatesMap.values());
    const scoredCandidates = candidates.map(c => {
      const cId = c.courseId;
      const kbCourse = curriculumKb.find(kb => kb.courseId.toLowerCase().replace(/\s+/g, '') === cId.toLowerCase().replace(/\s+/g, ''));
      
      const grade = c.value !== null ? c.value : 3.0;
      const downstreamCount = getDownstreamCount(cId);
      const bottleneckWeight = kbCourse?.bottleneckWeight || 1;
      
      let importanceWeight = 1;
      if (kbCourse?.academicImportanceLevel === 'CRITICAL') importanceWeight = 10;
      else if (kbCourse?.academicImportanceLevel === 'HIGH') importanceWeight = 7;
      else if (kbCourse?.academicImportanceLevel === 'MEDIUM') importanceWeight = 4;
      
      const foundationWeight = Math.max(0, 7 - (kbCourse?.semester || 1));
      const centralityObj = courseCentrality[cId];
      const centralityScore = centralityObj ? centralityObj.centralityScore : 0.0;
      
      const priority = (10 - grade) * 2 +
                       downstreamCount * 4 +
                       bottleneckWeight * 3 +
                       importanceWeight * 2 +
                       foundationWeight * 5 +
                       centralityScore * 5;
      
      return {
        course: c,
        priority,
        grade,
        downstreamCount,
        bottleneckWeight,
        importanceVal: importanceWeight,
        kbCourse
      };
    });
    
    scoredCandidates.sort((a, b) => b.priority - a.priority);
    const bestCandidate = scoredCandidates[0];
    
    if (bestCandidate) {
      const rcCode = bestCandidate.course.courseId;
      const kbCourse = bestCandidate.kbCourse;
      const courseNameStr = kbCourse ? kbCourse.courseName : (syllabusGraph[rcCode]?.name || courseDependency[rcCode]?.role || rcCode);
      const isWeakPassed = bestCandidate.course.status !== 'FAILED' && bestCandidate.course.value !== null && bestCandidate.course.value >= 5.0;
      
      const rcPath = [];
      let curr = rcCode;
      let pathVisited = new Set();
      while (curr && !pathVisited.has(curr)) {
        pathVisited.add(curr);
        const currScoreObj = scores.find(s => s.courseId === curr);
        const currKb = curriculumKb.find(kb => kb.courseId.toLowerCase().replace(/\s+/g, '') === curr.toLowerCase().replace(/\s+/g, ''));
        const currName = currKb ? currKb.courseName : (syllabusGraph[curr]?.name || curr);
        const currGrade = currScoreObj ? currScoreObj.value : null;
        const currStatus = currScoreObj ? currScoreObj.status : null;
        
        rcPath.push({
          courseId: curr,
          name: currName,
          grade: currGrade,
          status: currStatus === 'FAILED' || (currGrade !== null && currGrade < 5.0) ? 'FAILED' : (currGrade !== null && currGrade < 7.0 ? 'WEAK' : 'OK')
        });
        
        const nextNode = Object.entries(syllabusGraph).find(([key, val]) => val.prerequisites && val.prerequisites.includes(curr));
        if (nextNode && troubledCourses.some(tc => tc.courseId === nextNode[0])) {
          curr = nextNode[0];
        } else {
          curr = null;
        }
      }
      
      let explanation = '';
      const missingSkillsFormatted = kbCourse && kbCourse.coreSkills ? kbCourse.coreSkills.map(s => `• ${s}`).join('\n') : '';
      const affectedClosFormatted = kbCourse && kbCourse.learningOutcomes ? kbCourse.learningOutcomes.map(c => `• ${c.split(':')[0]}`).join('\n') : '';
      const affectedCareersFormatted = kbCourse && kbCourse.careerRelevance ? kbCourse.careerRelevance.map(c => `• ${c}`).join('\n') : '';
      
      const nextCourses = blockedCourses.filter(bc => bc.failedCourse === rcCode);
      const futureDownstreamList = getFutureDownstreamCourses(rcCode);
      const affectedCoursesFormatted = futureDownstreamList.length > 0
        ? futureDownstreamList.map(c => `• ${c.courseId} (${c.name})`).join('\n')
        : (nextCourses.length > 0 ? nextCourses.map(c => `• ${c.blockedCourse} (${c.blockedCourseName})`).join('\n') : '');
      
      const priorityLabel = kbCourse ? (
        kbCourse.academicImportanceLevel === 'CRITICAL' ? '🔴 Rất cao (Critical)' :
        kbCourse.academicImportanceLevel === 'HIGH' ? '🔴 Cao (High)' :
        kbCourse.academicImportanceLevel === 'MEDIUM' ? '🟡 Trung bình (Medium)' : '🔵 Thấp (Low)'
      ) : '🟡 Trung bình (Medium)';
      
      if (isWeakPassed) {
        explanation = `Sinh viên đạt điểm số yếu ở môn ${rcCode} (${courseNameStr}) với điểm số: ${bestCandidate.grade.toFixed(1)}/10.\n\n`;
        if (affectedCoursesFormatted) {
          explanation += `Môn học bị ảnh hưởng trực tiếp (nguy cơ do nền tảng yếu):\n${affectedCoursesFormatted}\n\n`;
        }
        if (missingSkillsFormatted) {
          explanation += `Kỹ năng còn thiếu/yếu:\n${missingSkillsFormatted}\n\n`;
        }
        if (affectedClosFormatted) {
          explanation += `Chuẩn đầu ra bị ảnh hưởng:\n${affectedClosFormatted}\n\n`;
        }
        if (affectedCareersFormatted) {
          explanation += `Nghề nghiệp bị ảnh hưởng:\n${affectedCareersFormatted}\n\n`;
        }
        explanation += `Mức độ tác động: ${priorityLabel}`;
      } else {
        explanation = `Môn ${rcCode} (${courseNameStr}) chưa đạt.\n\n`;
        if (affectedCoursesFormatted) {
          explanation += `Môn học bị ảnh hưởng trực tiếp:\n${affectedCoursesFormatted}\n\n`;
        } else {
          explanation += `Môn học bị ảnh hưởng: Không trực tiếp chặn môn chuyên ngành tiếp theo.\n\n`;
        }
        if (missingSkillsFormatted) {
          explanation += `Kỹ năng còn thiếu:\n${missingSkillsFormatted}\n\n`;
        }
        if (affectedClosFormatted) {
          explanation += `Chuẩn đầu ra bị ảnh hưởng:\n${affectedClosFormatted}\n\n`;
        }
        if (affectedCareersFormatted) {
          explanation += `Nghề nghiệp bị ảnh hưởng:\n${affectedCareersFormatted}\n\n`;
        }
        explanation += `Mức độ tác động: ${priorityLabel}`;
      }
      
      const hasInProgressRetake = scores.some(s => s.courseId === rcCode && (s.status === 'STUDYING' || s.status === 'NOT_STARTED'));
      const hasPassedRetake = scores.some(s => s.courseId === rcCode && s.status === 'PASSED');
      const isCompleted = hasPassedRetake && !hasInProgressRetake;
      
      rootCause = {
        courseId: rcCode,
        name: courseNameStr,
        explanation,
        academicImportanceLevel: kbCourse ? kbCourse.academicImportanceLevel : 'MEDIUM',
        bottleneckWeight: kbCourse ? kbCourse.bottleneckWeight : 1,
        missingSkills: kbCourse ? (kbCourse.coreSkills || []) : [],
        learningOutcomes: kbCourse ? (kbCourse.learningOutcomes || []) : [],
        technologiesTools: kbCourse ? (kbCourse.technologiesTools || []) : [],
        commonFailureReasons: kbCourse ? (kbCourse.commonFailureReasons || []) : [],
        remediationRecommendations: kbCourse ? (kbCourse.remediationRecommendations || []) : [],
        careerRelevance: kbCourse ? (kbCourse.careerRelevance || []) : [],
        path: rcPath,
        isCompleted
      };
    }
  }

  // Compute Skills Gap Analysis
  const failedOrWeakCoursesList = [];
  const allMissingSkills = new Set();
  const allMissingCLOs = [];
  const allMissingTools = new Set();

  scores.forEach(s => {
    const isFailed = s.status === 'FAILED' || (s.value !== null && s.value < 5.0);
    const isWeak = s.value !== null && s.value >= 5.0 && s.value < 7.0;
    
    if (isFailed || isWeak) {
      const kbC = curriculumKb.find(c => c.courseId.toLowerCase().replace(/\s+/g, '') === s.courseId.toLowerCase().replace(/\s+/g, ''));
      if (kbC) {
        failedOrWeakCoursesList.push({
          courseId: s.courseId,
          courseName: kbC.courseName,
          status: isFailed ? 'FAILED' : 'WEAK',
          grade: s.value,
          academicImportanceLevel: kbC.academicImportanceLevel,
          skills: kbC.coreSkills || [],
          learningOutcomes: kbC.learningOutcomes || [],
          technologiesTools: kbC.technologiesTools || []
        });
        (kbC.coreSkills || []).forEach(sk => allMissingSkills.add(sk));
        (kbC.learningOutcomes || []).forEach(clo => allMissingCLOs.push({ courseId: s.courseId, clo }));
        (kbC.technologiesTools || []).forEach(t => allMissingTools.add(t));
      }
    }
  });

  const skillsGapAnalysis = {
    failedOrWeakCourses: failedOrWeakCoursesList,
    allMissingSkills: Array.from(allMissingSkills),
    allMissingCLOs: allMissingCLOs,
    allMissingTools: Array.from(allMissingTools)
  };

  // Compute Career Impact Analysis
  const careerImpactAnalysis = [];
  if (courseCareerMapping && courseCareerMapping.careers) {
    Object.entries(courseCareerMapping.careers).forEach(([careerName, mapping]) => {
      const required = mapping.requiredCourses || [];
      const requiredFailedOrWeak = required.filter(cid => 
        scores.some(s => {
          const isFailedOrWeak = s.status === 'FAILED' || (s.value !== null && s.value < 7.0);
          return isFailedOrWeak && s.courseId.toLowerCase().replace(/\s+/g, '') === cid.toLowerCase().replace(/\s+/g, '');
        })
      );
      
      const failedRequiredDetails = requiredFailedOrWeak.map(cid => {
        const kbC = curriculumKb.find(c => c.courseId.toLowerCase().replace(/\s+/g, '') === cid.toLowerCase().replace(/\s+/g, ''));
        return {
          courseId: cid,
          courseName: kbC ? kbC.courseName : cid
        };
      });

      const requiredCoursesDetails = required.map(cid => {
        const cleanCid = cid.toLowerCase().replace(/\s+/g, '');
        const scoreObj = scores.find(s => s.courseId.toLowerCase().replace(/\s+/g, '') === cleanCid);
        const kbC = curriculumKb.find(c => c.courseId.toLowerCase().replace(/\s+/g, '') === cleanCid);
        return {
          courseId: cid,
          courseName: kbC ? kbC.courseName : cid,
          grade: scoreObj ? scoreObj.value : null,
          status: scoreObj ? scoreObj.status : 'NOT_STARTED'
        };
      });

      let status = 'SAFE'; 
      let riskLabel = 'An toàn';
      let color = 'emerald';
      
      const failCount = requiredFailedOrWeak.length;
      if (failCount >= 3) {
        status = 'CRITICAL';
        riskLabel = 'Nguy cơ cực cao';
        color = 'rose';
      } else if (failCount >= 2) {
        status = 'HIGH_RISK';
        riskLabel = 'Rủi ro cao';
        color = 'orange';
      } else if (failCount >= 1) {
        status = 'WARNING';
        riskLabel = 'Cảnh báo';
        color = 'amber';
      }

      // Compile detailed required skills validation with database & syllabus evidence
      const requiredSkillsDetails = (mapping.requiredSkills || []).map(sk => {
        // Find which course teaches this skill
        let teachingCourseId = null;
        if (courseSkillGraph && courseSkillGraph.skills && courseSkillGraph.skills[sk]) {
          const coursesForSkill = courseSkillGraph.skills[sk].courses || [];
          if (coursesForSkill.length > 0) {
            teachingCourseId = coursesForSkill[0];
          }
        }
        
        // Fallback search
        if (!teachingCourseId) {
          const kbC = curriculumKb.find(c => (c.coreSkills || []).includes(sk));
          if (kbC) {
            teachingCourseId = kbC.courseId;
          }
        }

        // Find the student's score for this course
        let grade = null;
        let scoreStatus = 'NOT_STARTED';
        let isPossessed = false;
        let courseName = teachingCourseId || '';
        
        if (teachingCourseId) {
          const cleanTarget = teachingCourseId.toLowerCase().replace(/\s+/g, '');
          const scoreObj = scores.find(s => s.courseId.toLowerCase().replace(/\s+/g, '') === cleanTarget);
          const kbC = curriculumKb.find(c => c.courseId.toLowerCase().replace(/\s+/g, '') === cleanTarget);
          if (kbC) {
            courseName = kbC.courseName;
          }
          if (scoreObj) {
            grade = scoreObj.value;
            scoreStatus = scoreObj.status;
            const isFailed = scoreStatus === 'FAILED' || (grade !== null && grade < 5.0);
            const isWeak = grade !== null && grade >= 5.0 && grade < 7.0;
            isPossessed = !isFailed && !isWeak;
          } else {
            isPossessed = false;
          }
        } else {
          isPossessed = false;
        }

        // Pull syllabus evidence from curriculumKb
        let syllabusSource = '';
        let syllabusLocation = '';
        let syllabusCLO = '';

        if (teachingCourseId) {
          const cleanTarget = teachingCourseId.toLowerCase().replace(/\s+/g, '');
          const kbC = curriculumKb.find(c => c.courseId.toLowerCase().replace(/\s+/g, '') === cleanTarget);
          if (kbC && kbC.evidence && kbC.evidence[sk]) {
            syllabusSource = kbC.evidence[sk].source;
            syllabusLocation = kbC.evidence[sk].location;
            syllabusCLO = kbC.evidence[sk].learningOutcome;
          } else if (kbC) {
            syllabusSource = `FPT Polytechnic Syllabus - ${kbC.courseId} ${kbC.courseName}`;
            syllabusLocation = `Bài thực hành chuyên sâu kỹ năng ${sk}`;
            syllabusCLO = kbC.learningOutcomes ? kbC.learningOutcomes[0] : '';
          }
        }

        return {
          skillName: sk,
          isPossessed,
          teachingCourseId,
          teachingCourseName: courseName,
          grade,
          status: scoreStatus,
          syllabusSource,
          syllabusLocation,
          syllabusCLO
        };
      });

      careerImpactAnalysis.push({
        careerName,
        status,
        riskLabel,
        color,
        failedRequiredCount: failCount,
        failedRequiredCourses: failedRequiredDetails,
        requiredCourses: requiredCoursesDetails,
        requiredSkills: requiredSkillsDetails
      });
    });
  }

  // 5. Risk Contributors
  // Note: Factors are derived exclusively from actual database attributes.
  // Attendance and Behavior anomalies are excluded as they are not present in the database.
  const factorsSum = Object.values(baseRisk.factors).reduce((a, b) => a + b, 0);
  const riskContributors = [];
  const factorLabels = {
    LOW_GPA: 'GPA nền tảng thấp',
    PREREQUISITE_BREAK: failedCourses.length > 0 ? `Kiến thức yếu môn tiên quyết ${failedCourses.slice(0, 2).join(', ')}` : 'Hổng môn tiên quyết',
    TREND_DECLINE: 'GPA suy giảm qua các học kỳ',
    DELAY_RISK: 'Chỉ số trễ tiến độ tốt nghiệp (Heuristic Delay)'
  };

  Object.entries(baseRisk.factors).forEach(([key, val]) => {
    if (val > 0) {
      const percentage = factorsSum > 0 ? Math.round((val / factorsSum) * 100) : 0;
      riskContributors.push({
        factor: key,
        label: factorLabels[key] || key,
        score: val,
        percentage
      });
    }
  });
  riskContributors.sort((a, b) => b.score - a.score);

  // 6. Future Course Impact
  const futureImpacts = [];
  const riskPredictions = predictions.filter(p => p.risk === 'HIGH' || p.risk === 'CRITICAL');
  
  riskPredictions.forEach(pred => {
    futureImpacts.push({
      courseId: pred.courseId,
      name: syllabusGraph[pred.courseId]?.name || pred.courseId,
      risk: pred.risk,
      predictedScore: pred.predictedScore,
      warning: `Rủi ro ${pred.risk === 'CRITICAL' ? 'Nguy cấp' : 'Cao'} (Dự đoán đạt ${pred.predictedScore.toFixed(1)}đ). Cần khắc phục gấp kiến thức tiên quyết.`
    });
  });

  // If no upcoming risk but failed courses block future ones, add those
  blockedCourses.forEach(bc => {
    if (!futureImpacts.some(fi => fi.courseId === bc.blockedCourse)) {
      futureImpacts.push({
        courseId: bc.blockedCourse,
        name: bc.blockedCourseName,
        risk: 'HIGH',
        predictedScore: 0.0,
        warning: `Bị chặn học phần tiên quyết bởi môn ${bc.failedCourse}. Cần học lại môn gốc để mở khóa.`
      });
    }
  });

  // 7. Graduation Risk & Delay Index Engine
  const { delayScore, failedCredits, blockedCount, maxChainDepth, bottleneckWeight } = calculateDelayScore(scores, syllabusGraph, courseDependency);

  let gradRiskLevel = 'LOW';
  let gradRiskDesc = 'Tiến độ học tập bình thường. Đủ điều kiện ra trường đúng hạn.';
  let delaySemesters = 0;

  if (delayScore >= 35) {
    gradRiskLevel = 'CRITICAL';
    delaySemesters = 2;
    gradRiskDesc = `Nguy cơ chậm tốt nghiệp cực kỳ nghiêm trọng (Delay Score: ${delayScore}). Nợ ${failedCourses.length} môn học (gồm các tiên quyết then chốt), chặn dây chuyền ${blockedCount} môn chuyên ngành tiếp theo. Dự kiến ra trường trễ ít nhất 2 học kỳ chính.`;
  } else if (delayScore >= 20) {
    gradRiskLevel = 'HIGH';
    delaySemesters = 1.5;
    gradRiskDesc = `Nguy cơ chậm tốt nghiệp cao (Delay Score: ${delayScore}). Thất bại ở môn tiên quyết cốt lõi gây tắc nghẽn chuỗi, chặn đứng ${blockedCount} học phần phía sau. Dự kiến chậm ra trường từ 1 đến 2 học kỳ chính.`;
  } else if (delayScore >= 5) {
    gradRiskLevel = 'MEDIUM';
    delaySemesters = 1;
    gradRiskDesc = `Nguy cơ chậm tốt nghiệp trung bình (Delay Score: ${delayScore}). Nợ ${failedCourses.length} môn. Hệ thống đề xuất đăng ký học bù học kỳ hè (Summer Term) để đuổi kịp tiến độ đúng hạn.`;
  } else if (delayScore > 0) {
    gradRiskLevel = 'LOW';
    delaySemesters = 0.5;
    gradRiskDesc = `Rủi ro chậm tốt nghiệp thấp (Delay Score: ${delayScore}). Sinh viên chỉ nợ nhẹ 1 môn không tiên quyết chính, có thể trả nợ dễ dàng trong kỳ học hè kế tiếp.`;
  }

  // 7.5. Align Health Score with Graduation Risk
  let healthScore = Math.max(0, 100 - baseRisk.riskScore);
  let healthRating = 'KHỎE MẠNH 🟢';
  let healthDesc = 'Học lực ổn định, chuyên cần tốt, không có rủi ro lớn hiện hữu.';
  
  if (gradRiskLevel === 'CRITICAL') {
    healthRating = 'NGUY CẤP 🔴';
    healthDesc = 'Cảnh báo đỏ! Sinh viên trượt nhiều môn tiên quyết cốt lõi và gặp tắc nghẽn chuỗi môn học nghiêm trọng. Cần can thiệp khẩn cấp từ Cố vấn.';
    if (healthScore >= 40) healthScore = 35; 
  } else if (gradRiskLevel === 'HIGH') {
    healthRating = 'RỦI RO CAO 🟠';
    healthDesc = 'Có dấu hiệu đứt gãy kiến thức nền tảng và nợ môn tiên quyết làm chậm tiến độ tốt nghiệp. Cần kế hoạch can thiệp cụ thể.';
    if (healthScore >= 60 || healthScore < 40) healthScore = 52; 
  } else if (gradRiskLevel === 'MEDIUM') {
    healthRating = 'CẦN CHÚ Ý 🟡';
    healthDesc = 'Phong độ học tập có sự suy giảm nhẹ hoặc đang nợ một vài môn học có thể cải thiện được trong học kỳ hè.';
    if (healthScore >= 80 || healthScore < 60) healthScore = 72; 
  } else {
    if (healthScore < 80) healthScore = 85; 
  }

  // 8. Recovery Roadmap
  const recoveryRoadmap = [];
  if (rootCause) {
    const recs = rootCause.remediationRecommendations || [];
    if (recs.length >= 3) {
      recs.forEach((rec, rIdx) => {
        let phase = `Giai đoạn ${rIdx + 1}`;
        let title = rec;
        let focus = '';
        
        if (rec.includes(':')) {
          const parts = rec.split(':');
          const weekStr = parts[0].trim();
          phase = `Giai đoạn ${rIdx + 1} (${weekStr})`;
          title = `[Môn gốc ${rootCause.courseId}] ` + parts.slice(1).join(':').trim();
        } else {
          title = `[Môn gốc ${rootCause.courseId}] ` + rec;
        }
        
        if (rIdx === 0) {
          focus = `Tập trung củng cố kiến thức nền tảng và khắc phục lỗ hổng môn ${rootCause.courseId}. Ôn tập các kỹ năng thiếu hụt: ${rootCause.missingSkills ? rootCause.missingSkills.join(', ') : 'N/A'}.`;
        } else if (rIdx === 1) {
          focus = `Thực hành thiết kế hoặc viết mã dự án mini (mini-project) áp dụng các công nghệ/công cụ: ${rootCause.technologiesTools ? rootCause.technologiesTools.join(', ') : 'N/A'}.`;
        } else if (rIdx === 2) {
          const cleanClos = rootCause.learningOutcomes ? rootCause.learningOutcomes.map(clo => clo.split(':')[0]).join(', ') : 'N/A';
          focus = `Đăng ký học phụ đạo (Tutor) tại trường để rà soát chuẩn đầu ra (CLOs) bị nợ: ${cleanClos}. Hoàn thành kiểm thử để vượt qua nguyên nhân gốc rễ học thuật này.`;
        }
        
        recoveryRoadmap.push({
          phase,
          title,
          focus
        });
      });
    } else {
      // Fallback if not enough recommendations
      let phase1Title = `Lập kế hoạch ôn tập: ${rootCause.courseId} - ${rootCause.name}`;
      let phase1Focus = `Học lại lý thuyết cơ bản và hoàn thành các bài lab của môn học.`;
      if (recs.length > 0) {
        phase1Title = `Can thiệp ${rootCause.courseId}: ${recs[0]}`;
        const firstSkill = rootCause.missingSkills && rootCause.missingSkills[0];
        const skillEv = firstSkill && rootCause.technologiesTools ? ` (Kỹ năng: ${firstSkill}, Công cụ: ${rootCause.technologiesTools.slice(0, 2).join(', ')})` : '';
        phase1Focus = `Tập trung hoàn thành nội dung thực hành môn ${rootCause.courseId}${skillEv}. Bám sát đề cương chi tiết học phần để khắc phục lỗ hổng kiến thức gốc rễ sớm nhất.`;
      }
      recoveryRoadmap.push({
        phase: 'Giai đoạn 1 (Tuần 1 - 4)',
        title: phase1Title,
        focus: phase1Focus
      });

      let phase2Title = `Ôn tập môn kế thừa`;
      let phase2Focus = `Tìm hiểu các khái niệm nâng cao để chuẩn bị học lại hoặc cải thiện điểm số.`;
      const nextCourses = blockedCourses.filter(bc => bc.failedCourse === rootCause.courseId);
      if (recs.length > 1) {
        phase2Title = `Nhiệm vụ can thiệp 2: ${recs[1]}`;
        phase2Focus = `Thực hiện rèn luyện nâng cao theo khuyến nghị từ giáo trình FPT Polytechnic.`;
        if (nextCourses.length > 0) {
          phase2Focus += ` Chuẩn bị sẵn sàng kiến thức để mở khóa chuỗi môn học bị chặn kế thừa phía sau: ${nextCourses.map(c => c.blockedCourse).join(', ')}.`;
        }
      } else if (nextCourses.length > 0) {
        phase2Title = `Ôn tập môn kế thừa: ${nextCourses.map(c => c.blockedCourse).join(', ')}`;
        phase2Focus = `Tìm hiểu các khái niệm nâng cao của các môn bị chặn chuyên ngành phía sau để sẵn sàng học bù ngay khi mở khóa môn gốc.`;
      } else {
        phase2Title = 'Củng cố tư duy lập trình nâng cao';
        phase2Focus = 'Thực hành các cấu trúc dữ liệu modern, kỹ thuật lập trình nâng cao và kết nối API thực tế.';
      }
      recoveryRoadmap.push({
        phase: 'Giai đoạn 2 (Tuần 5 - 8)',
        title: phase2Title,
        focus: phase2Focus
      });

      let phase3Title = `Hoàn thiện Project thực chiến & Tutor`;
      let phase3Focus = `Đăng ký tham gia nhóm học phụ đạo (Tutor) 1 kèm 1 từ nhà trường. Hoàn thiện một đồ án cá nhân nhỏ để tích hợp các kỹ năng đã học, sẵn sàng cho kỳ học mới.`;
      if (recs.length > 2) {
        phase3Title = `Nhiệm vụ can thiệp 3: ${recs[2]}`;
        phase3Focus = `Đăng ký tham gia nhóm Tutor học thuật tại trường để được hỗ trợ 1 kèm 1. Thực hành làm đồ án nhỏ (mini project) áp dụng các công nghệ đã được học để chứng minh năng lực thực tế.`;
      }
      recoveryRoadmap.push({
        phase: 'Giai đoạn 3 (Tuần 9 - 12)',
        title: phase3Title,
        focus: phase3Focus
      });
    }
  } else if (failedCourses.length > 0) {
    recoveryRoadmap.push({
      phase: 'Giai đoạn 1 (Tuần 1 - 4)',
      title: `Ôn tập môn nợ: ${failedCourses[0]}`,
      focus: `Học lại lý thuyết cơ bản và hoàn thành các bài lab môn ${failedCourses[0]}.`
    });
    recoveryRoadmap.push({
      phase: 'Giai đoạn 2 (Tuần 5 - 8)',
      title: 'Tăng cường tự học nhóm',
      focus: 'Tạo nhóm học tập cùng bạn bè hoặc liên hệ Cố vấn học thuật để ghép cặp với Mentor.'
    });
    recoveryRoadmap.push({
      phase: 'Giai đoạn 3 (Tuần 9 - 12)',
      title: 'Kiểm tra chéo chuẩn đầu ra',
      focus: 'Giải các đề thi mẫu và làm bài kiểm tra thử để sẵn sàng thi qua môn.'
    });
  } else {
    recoveryRoadmap.push({
      phase: 'Lộ trình duy trì (12 tuần)',
      title: 'Phát triển nâng cao',
      focus: 'Duy trì phong độ học tập hiện tại. Khuyến khích đăng ký học các môn chuyên ngành nâng cao hoặc tham gia các câu lạc bộ học thuật để tích lũy kinh nghiệm làm dự án tốt nghiệp sớm.'
    });
  }

  // 8.5. Intervention Recommendation Engine
  let interventionRec = {
    riskLevel: gradRiskLevel, 
    actionCode: 'PERIODIC_MONITORING',
    actionTitle: 'Theo dõi định kỳ & Duy trì phong độ',
    description: 'Sinh viên đang có tiến độ học tập tốt và an toàn. Hệ thống khuyến nghị tiếp tục theo dõi định kỳ, khuyến khích sinh viên duy trì phong độ hiện tại để chuẩn bị tốt cho dự án tốt nghiệp.',
    colorClass: 'emerald'
  };

  if (gradRiskLevel === 'CRITICAL') {
    interventionRec = {
      riskLevel: 'CRITICAL',
      actionCode: 'EMAIL_ADVISOR',
      actionTitle: 'Gửi Email khẩn cấp cho Cố vấn học tập & Phụ huynh',
      description: 'Mức độ rủi ro NGUY CẤP. Hệ thống tự động kích hoạt luồng đề xuất gửi thông báo khẩn cho Cố vấn học tập và phụ huynh qua email/SMS để phối hợp gặp mặt trực tiếp, thảo luận phương án can thiệp khẩn cấp tránh bị buộc thôi học.',
      colorClass: 'rose'
    };
  } else if (gradRiskLevel === 'HIGH') {
    interventionRec = {
      riskLevel: 'HIGH',
      actionCode: 'INVITE_TUTOR',
      actionTitle: 'Mời tham gia Lớp Tutor & Mentorship cá nhân (1 kèm 1)',
      description: 'Mức độ rủi ro CAO. Hệ thống đề xuất ghi danh tự động sinh viên vào danh sách chờ xếp lớp học nhóm Tutor cấp tốc buổi tối (miễn phí) và ghép cặp với Mentor học tập (sinh viên giỏi khóa trên) để lấp lỗ hổng kiến thức nền tảng.',
      colorClass: 'rose'
    };
  } else if (gradRiskLevel === 'MEDIUM') {
    interventionRec = {
      riskLevel: 'MEDIUM',
      actionCode: 'SELF_STUDY_ROADMAP',
      actionTitle: 'Đề xuất Lộ trình Tự học cải thiện 12 tuần',
      description: 'Mức độ rủi ro TRUNG BÌNH. Hệ thống tự động biên soạn một lộ trình tự học cá nhân hóa 12 tuần (chia làm 3 giai đoạn) tập trung giải quyết lỗ hổng kiến thức của các môn học tiên quyết. Sinh viên cần hoàn thành các cột mốc tự học theo kế hoạch.',
      colorClass: 'amber'
    };
  } else if (gradRiskLevel === 'LOW' && delaySemesters > 0) {
    interventionRec = {
      riskLevel: 'LOW_WARNING',
      actionCode: 'SELF_STUDY_ROADMAP',
      actionTitle: 'Đề xuất Đăng ký học kỳ hè (Summer Term)',
      description: 'Mức độ rủi ro nhẹ. Sinh viên chỉ cần đăng ký học bù môn đang nợ trong học kỳ hè sắp tới để đảm bảo không bị chậm tiến độ tốt nghiệp của cả khóa.',
      colorClass: 'blue'
    };
  }

  // Apply expert intervention rules if rootCause exists
  if (rootCause) {
    if (rootCause.isCompleted) {
      // Find downstream courses affected
      const futureDownstreamList = getFutureDownstreamCourses(rootCause.courseId);
      const downstreamNames = futureDownstreamList.map(c => `${c.courseId} (${c.name})`);
      
      interventionRec = {
        riskLevel: rootCause.academicImportanceLevel || 'MEDIUM',
        actionCode: 'WEAK_FOUNDATION_WARNING',
        actionTitle: `Cảnh báo nền tảng yếu: Môn ${rootCause.courseId}`,
        description: `Sinh viên đã hoàn thành môn ${rootCause.courseId} (${rootCause.name}) nhưng với điểm số chưa vững (${rootCause.path[0]?.grade?.toFixed(1) || '5.x'}). Nguy cơ cao khi học các môn chuyên ngành tiếp theo phụ thuộc vào nền tảng này: ${downstreamNames.length > 0 ? downstreamNames.join(', ') : 'Các môn chuyên ngành tiếp theo'}. Đề xuất củng cố kiến thức trước khi bắt đầu môn mới.`,
        colorClass: 'amber'
      };
    } else {
      const matchingRule = courseInterventionRules && courseInterventionRules.rules 
        ? courseInterventionRules.rules.find(r => r.courseId.toLowerCase().replace(/\s+/g, '') === rootCause.courseId.toLowerCase().replace(/\s+/g, ''))
        : null;
        
      if (matchingRule) {
        const priority = matchingRule.riskPriority; 
        let color = 'rose';
        if (priority === 'HIGH') color = 'orange';
        if (priority === 'MEDIUM') color = 'amber';
        if (priority === 'LOW') color = 'blue';
        
        interventionRec = {
          riskLevel: priority,
          actionCode: `INTERVENTION_${rootCause.courseId}`,
          actionTitle: `Can thiệp học thuật: Khắc phục môn ${rootCause.courseId} (${rootCause.name})`,
          description: `${matchingRule.advisoryMessage}\n\nKhuyến nghị các bước can thiệp cụ thể:\n` + 
            matchingRule.remediationSteps.map((step, idx) => `${idx + 1}. ${step}`).join('\n'),
          colorClass: color
        };
      }
    }
  }

  // 9. Program-Level Comparison
  const courseIds = scores.filter(s => s.value !== null).map(s => s.courseId);
  const programComparison = [];

  if (courseIds.length > 0) {
    const now = Date.now();
    let courseStats = cachedCourseStats;
    if (!courseStats || now - lastCourseStatsTime > CACHE_DURATION) {
      const allScores = await prisma.score.findMany({
        where: { value: { not: null } }
      });
      const statsMap = {};
      allScores.forEach(s => {
        if (!statsMap[s.courseId]) {
          statsMap[s.courseId] = [];
        }
        statsMap[s.courseId].push(s);
      });
      
      courseStats = {};
      Object.entries(statsMap).forEach(([cid, scoresList]) => {
        const vals = scoresList.map(s => s.value);
        const avg = vals.reduce((sum, v) => sum + v, 0) / vals.length;
        const passedCount = scoresList.filter(s => s.status === 'PASSED' || s.value >= 5.0).length;
        const passRate = (passedCount / scoresList.length) * 100;
        courseStats[cid] = {
          avg: Math.round(avg * 10) / 10,
          passRate: Math.round(passRate * 10) / 10
        };
      });
      cachedCourseStats = courseStats;
      lastCourseStatsTime = now;
    }

    scores.forEach(s => {
      if (s.value === null) return;
      const stat = courseStats[s.courseId];
      if (stat) {
        programComparison.push({
          courseId: s.courseId,
          courseName: s.course?.name || s.courseId,
          studentGrade: s.value,
          classAverage: stat.avg,
          difference: Math.round((s.value - stat.avg) * 10) / 10,
          classPassRate: stat.passRate
        });
      }
    });
  }

  // Generate Dependency Heatmap
  const dependencyHeatmap = [];
  const weakOrFailedScores = scores.filter(s => s.status === 'FAILED' || (s.value !== null && s.value < 7.0));
  weakOrFailedScores.forEach(s => {
    const cId = s.courseId;
    const grade = s.value !== null ? s.value : 3.0;
    const downstreamCount = getDownstreamCount(cId);
    const centralityObj = courseCentrality[cId];
    const centralityScore = centralityObj ? centralityObj.centralityScore : 0.0;
    const kbC = curriculumKb.find(kb => kb.courseId.toLowerCase().replace(/\s+/g, '') === cId.toLowerCase().replace(/\s+/g, ''));
    
    const influence = (10 - grade) * 2 + downstreamCount * 3 + centralityScore * 5;
    const riskInfluenceScore = Math.round(influence * 10) / 10;
    const courseName = kbC ? kbC.courseName : (syllabusGraph[cId]?.name || cId);
    
    dependencyHeatmap.push({
      courseId: cId,
      name: courseName,
      grade,
      downstreamCount,
      centralityScore,
      riskInfluenceScore
    });
  });
  dependencyHeatmap.sort((a, b) => b.riskInfluenceScore - a.riskInfluenceScore);

  return {
    academicHealth: {
      score: healthScore,
      rating: healthRating,
      description: healthDesc,
      cohortRank: rank,
      totalCohort,
      cohortPercentile
    },
    trendAnalysis: {
      trendData,
      status: trendStatus,
      explanation: trendExplanation
    },
    knowledgeDependency: {
      failedCourses,
      blockedCourses
    },
    rootCauseAnalysis: rootCause,
    riskContributors,
    futureCourseImpact: futureImpacts,
    graduationRisk: {
      level: gradRiskLevel,
      description: gradRiskDesc,
      delaySemesters,
      delayScore
    },
    recoveryRoadmap,
    interventionRecommendation: interventionRec,
    skillsGapAnalysis,
    careerImpactAnalysis,
    dependencyHeatmap
  };
}

/**
 * Calculate class-wide / program-wide aggregated metrics (Program Analytics)
 */
async function computeProgramAnalytics() {
  const students = await prisma.student.findMany({
    include: { scores: true, predictions: true }
  });

  if (students.length === 0) {
    return {
      totalStudents: 0,
      riskLevelDistribution: { low: 0, medium: 0, high: 0, critical: 0 },
      topFailedCourses: [],
      topWeakestCLOs: [],
      topSkillGaps: [],
      topPrerequisiteBottlenecks: []
    };
  }

  // 1. Calculate Risk Level Distribution
  const riskProfiles = students.map(s => {
    const risk = calculateBaseRisk(s);
    return { mssv: s.mssv || s.id, level: risk.level, riskScore: risk.riskScore };
  });

  const lowCount = riskProfiles.filter(r => r.level === 'LOW').length;
  const medCount = riskProfiles.filter(r => r.level === 'MEDIUM').length;
  const highCount = riskProfiles.filter(r => r.level === 'HIGH').length;
  const critCount = riskProfiles.filter(r => r.level === 'CRITICAL').length;

  // 2. Calculate Top Failed Courses
  const allScores = await prisma.score.findMany({
    include: { course: true }
  });

  const courseStats = {};
  allScores.forEach(s => {
    if (!courseStats[s.courseId]) {
      courseStats[s.courseId] = {
        courseCode: s.courseId,
        courseName: s.course?.name || s.courseId,
        total: 0,
        failed: 0
      };
    }
    courseStats[s.courseId].total++;
    if (s.status === 'FAILED' || (s.value !== null && s.value < 5.0)) {
      courseStats[s.courseId].failed++;
    }
  });

  // Calculate fail rate and filter out courses with less than 5 students
  const topFailedCourses = Object.values(courseStats)
    .filter(c => c.total >= 5 && c.courseCode !== 'PRO116')
    .map(c => ({
      ...c,
      failRate: Math.round((c.failed / c.total) * 100 * 10) / 10
    }))
    .sort((a, b) => b.failRate - a.failRate)
    .slice(0, 10);

  // 3. Calculate Top Weakest CLOs (Course Learning Outcomes)
  const cloMap = {
    'COM1071': ['Sử dụng MS Word chuyên nghiệp', 'Bảng tính Excel nâng cao', 'Trình bày PowerPoint chuẩn chỉnh'],
    'WEB2063': ['Lập trình ES6+ nâng cao', 'Xử lý bất đồng bộ (Promise, Async/Await)', 'Tương tác DOM nâng cao & Web API'],
    'WEB2041': ['Thiết kế CSDL quan hệ SQL', 'Phân tích yêu cầu và thiết kế UI/UX', 'Lập trình MVC cơ bản'],
    'PRO2201': ['Phát triển ứng dụng Web SPA (React/NextJS)', 'Xây dựng RESTful API Node.js', 'Triển khai dự án và bảo mật'],
    'PRO1014': ['Làm việc nhóm Agile/Scrum', 'Git workflow chuyên nghiệp', 'Tích hợp Frontend & Backend'],
    'WEB502': ['Static Type System & Interfaces', 'OOP & Design Patterns', 'Tích hợp TS vào React/Express'],
    'WEB503': ['Xây dựng Server Express.js', 'Tương tác CSDL MongoDB/SQL', 'JWT Authentication & Authorization'],
    'WEB2091': ['React Hooks nâng cao', 'Quản trị State (Redux, Context API)', 'Routing & Client-Side Rendering']
  };

  const cloWeakness = {};
  allScores.forEach(s => {
    if (s.value !== null && s.value < 5.5) {
      const clos = cloMap[s.courseId];
      if (clos) {
        clos.forEach(clo => {
          if (!cloWeakness[clo]) {
            cloWeakness[clo] = { cloName: clo, courseId: s.courseId, score: 0 };
          }
          cloWeakness[clo].score += (6.0 - s.value); // Higher weight for lower score
        });
      }
    }
  });

  const topWeakestCLOs = Object.values(cloWeakness)
    .map(c => ({
      ...c,
      count: Math.round(c.score)
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 4. Calculate Top Skill Gaps
  // Load skill mapping from courses.json
  const courseSkillsMap = {};
  if (Array.isArray(coursesJson)) {
    coursesJson.forEach(c => {
      if (c.courseCode && c.skills) {
        courseSkillsMap[c.courseCode] = c.skills;
      }
    });
  }

  const skillGaps = {};
  allScores.forEach(s => {
    if (s.status === 'FAILED' || (s.value !== null && s.value < 5.5)) {
      const skills = courseSkillsMap[s.courseId];
      if (skills) {
        skills.forEach(skill => {
          if (!skillGaps[skill]) {
            skillGaps[skill] = { skillName: skill, count: 0 };
          }
          skillGaps[skill].count++;
        });
      }
    }
  });

  const topSkillGaps = Object.values(skillGaps)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // 5. Calculate Top Prerequisite Bottlenecks
  const bottleneckStats = {};
  // Check which courses failed students took
  const failedStudentsScores = {};
  allScores.forEach(s => {
    if (s.status === 'FAILED' || (s.value !== null && s.value < 5.0)) {
      if (!failedStudentsScores[s.mssv]) failedStudentsScores[s.mssv] = [];
      failedStudentsScores[s.mssv].push(s.courseId);
    }
  });

  Object.entries(syllabusGraph).forEach(([cid, node]) => {
    if (node.unlocks && node.unlocks.length > 0) {
      // For each failed student who failed this prerequisite
      let bottleneckScore = 0;
      Object.entries(failedStudentsScores).forEach(([mssv, failedCids]) => {
        if (failedCids.includes(cid)) {
          // It blocks all downstream courses
          bottleneckScore += node.unlocks.length;
        }
      });

      if (bottleneckScore > 0) {
        bottleneckStats[cid] = {
          courseCode: cid,
          courseName: node.name,
          unlocksCount: node.unlocks.length,
          blockedStudentsCount: Math.round(bottleneckScore / node.unlocks.length),
          bottleneckScore
        };
      }
    }
  });

  const topPrerequisiteBottlenecks = Object.values(bottleneckStats)
    .sort((a, b) => b.bottleneckScore - a.bottleneckScore)
    .slice(0, 10);

  return {
    totalStudents: students.length,
    riskLevelDistribution: {
      low: lowCount,
      medium: medCount,
      high: highCount,
      critical: critCount
    },
    topFailedCourses,
    topWeakestCLOs,
    topSkillGaps,
    topPrerequisiteBottlenecks
  };
}

module.exports = {
  generateDetailedDSSReport,
  computeProgramAnalytics
};
