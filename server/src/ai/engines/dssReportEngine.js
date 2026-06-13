const fs = require('fs');
const path = require('path');
const { prisma } = require('../../infrastructure/database/prisma');
const { calculateBaseRisk, getRiskLevel } = require('./riskEngine');
const { calculateFptGPA, getCourseCredits } = require('../../utils/dataService');

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

  // 4. Root Cause Analysis (Prerequisite Failure Chain Traversal)
  // Recursive function to trace the earliest prerequisite failure or weak score (< 7.0)
  const findRootCauseForCourse = (courseId) => {
    const node = syllabusGraph[courseId];
    if (!node || !node.prerequisites || node.prerequisites.length === 0) {
      return courseId;
    }
    
    // Check if any prerequisite has a weak score (< 7.0) or is failed
    for (const prereq of node.prerequisites) {
      const scoreObj = scores.find(s => {
        const cleanP = prereq.toLowerCase().replace(/\s+/g, '');
        const cleanS = s.courseId.toLowerCase().replace(/\s+/g, '');
        return cleanS === cleanP || cleanS.includes(cleanP) || cleanP.includes(cleanS);
      });
      
      if (scoreObj && (scoreObj.status === 'FAILED' || (scoreObj.value !== null && scoreObj.value < 7.0))) {
        return findRootCauseForCourse(prereq);
      }
    }
    return courseId;
  };

  let rootCause = null;
  if (failedCourses.length > 0) {
    const rcList = [];
    failedCourses.forEach(fc => {
      const rcId = findRootCauseForCourse(fc);
      if (!rcList.includes(rcId)) {
        rcList.push(rcId);
      }
    });
    
    if (rcList.length > 0) {
      const rcCode = rcList[0];
      const rcScoreObj = scores.find(s => s.courseId === rcCode);
      const isWeakPassed = rcScoreObj && rcScoreObj.status !== 'FAILED' && rcScoreObj.value !== null && rcScoreObj.value < 7.0;
      
      let explanation = '';
      if (isWeakPassed) {
        explanation = `Điểm gãy nền tảng xuất phát từ môn ${rcCode} (${syllabusGraph[rcCode]?.name || rcCode}). Sinh viên tuy đã thi đỗ môn này nhưng chỉ đạt điểm số yếu (${rcScoreObj.value.toFixed(1)}/10), trực tiếp gây thiếu hụt kỹ năng và làm trượt chuỗi môn học kế thừa tiếp theo.`;
      } else {
        explanation = `Điểm gãy học thuật nghiêm trọng nhất xuất hiện sớm nhất tại môn ${rcCode} (${syllabusGraph[rcCode]?.name || rcCode}). Việc trượt môn này đã làm gián đoạn dây chuyền tiến độ học tập và chặn đứng các môn chuyên ngành phía sau.`;
      }
      
      rootCause = {
        courseId: rcCode,
        name: syllabusGraph[rcCode]?.name || courseDependency[rcCode]?.role || rcCode,
        explanation
      };
    }
  }

  // 5. Risk Contributors
  const factorsSum = Object.values(baseRisk.factors).reduce((a, b) => a + b, 0);
  const riskContributors = [];
  const factorLabels = {
    LOW_GPA: 'GPA nền tảng yếu',
    ATTENDANCE_DROP: 'Chuyên cần dưới ngưỡng',
    PREREQUISITE_BREAK: failedCourses.length > 0 ? `Nền tảng yếu môn ${failedCourses.slice(0, 2).join(', ')}` : 'Hổng môn tiên quyết',
    TREND_DECLINE: 'GPA giảm liên tục',
    BEHAVIOR_ANOMALY: 'Chuỗi môn fail gần đây',
    LEARNING_STYLE_MISMATCH: 'Lệch pha phong cách học & ngành'
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
  const failedCredits = completedScores.filter(s => s.status === 'FAILED').reduce((sum, s) => sum + getCourseCredits(s.courseId), 0);
  const blockedCount = blockedCourses.length;
  
  // Calculate Bottleneck Weight & Max Chain Depth
  let bottleneckWeight = 0;
  let maxChainDepth = 0;
  
  failedCourses.forEach(fc => {
    const directBlocked = blockedCourses.filter(bc => bc.failedCourse === fc);
    if (directBlocked.length >= 3) {
      bottleneckWeight += 15;
    } else if (directBlocked.length > 0) {
      bottleneckWeight += 8;
    }
    
    let depth = 0;
    let current = fc;
    while (depth < 6) { // Safety bound
      const nextNode = Object.entries(syllabusGraph).find(([key, val]) => val.prerequisites.includes(current));
      if (nextNode) {
        depth++;
        current = nextNode[0];
      } else {
        break;
      }
    }
    maxChainDepth = Math.max(maxChainDepth, depth);
  });

  const delayScore = failedCredits + (blockedCount * 3) + (maxChainDepth * 5) + bottleneckWeight;

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
    recoveryRoadmap.push({
      phase: 'Giai đoạn 1 (Tuần 1 - 4)',
      title: `Lấp lỗ hổng gốc rễ: ${rootCause.courseId}`,
      focus: `Học lại lý thuyết và tự làm lại các bài lab thực hành của môn ${rootCause.courseId} (${rootCause.name}). Tập trung vào các kiến thức nền tảng và CLO thiếu hụt.`
    });
    
    // Find intermediate blocked courses
    const nextCourses = blockedCourses.filter(bc => bc.failedCourse === rootCause.courseId);
    if (nextCourses.length > 0) {
      recoveryRoadmap.push({
        phase: 'Giai đoạn 2 (Tuần 5 - 8)',
        title: `Ôn tập môn kế thừa: ${nextCourses.map(c => c.blockedCourse).join(', ')}`,
        focus: `Tìm hiểu các khái niệm nâng cao của môn ${nextCourses.map(c => c.blockedCourse).join(', ')} để chuẩn bị học lại hoặc cải thiện điểm số.`
      });
    } else {
      recoveryRoadmap.push({
        phase: 'Giai đoạn 2 (Tuần 5 - 8)',
        title: 'Củng cố tư duy lập trình nâng cao',
        focus: 'Thực hành các cấu trúc dữ liệu modern, kỹ thuật lập trình nâng cao và kết nối API thực tế.'
      });
    }

    recoveryRoadmap.push({
      phase: 'Giai đoạn 3 (Tuần 9 - 12)',
      title: 'Hoàn thiện Project thực chiến & Tutor',
      focus: 'Đăng ký tham gia nhóm học phụ đạo (Tutor) 1 kèm 1 từ nhà trường. Hoàn thiện một đồ án cá nhân nhỏ để tích hợp các kỹ năng đã học, sẵn sàng cho kỳ học mới.'
    });
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
    interventionRecommendation: interventionRec
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
      const clos = cloMap[s.courseId] || [
        `Kỹ năng thực hành ${s.courseId}`,
        `Tư duy logic môn ${s.courseId}`,
        `Ứng dụng chuẩn đầu ra ${s.courseId}`
      ];
      clos.forEach(clo => {
        if (!cloWeakness[clo]) {
          cloWeakness[clo] = { cloName: clo, courseId: s.courseId, count: 0 };
        }
        cloWeakness[clo].count += (6.0 - s.value); // Higher weight for lower score
      });
    }
  });

  const topWeakestCLOs = Object.values(cloWeakness)
    .map(c => ({
      ...c,
      count: Math.round(c.count)
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
      const skills = courseSkillsMap[s.courseId] || ['Logic lập trình', 'Thực hành kỹ thuật'];
      skills.forEach(skill => {
        if (!skillGaps[skill]) {
          skillGaps[skill] = { skillName: skill, count: 0 };
        }
        skillGaps[skill].count++;
      });
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
