const knowledgeCache = require('../knowledge/cache');
const { analyzeBehavior } = require('./behavior-engine');

const getStudentCourseStatus = (student, courseCode, courseName) => {
  if (!student || !student.courseStatus) return undefined;
  
  if (student.courseStatus[courseCode] !== undefined) return student.courseStatus[courseCode];
  if (student.courseStatus[courseName] !== undefined) return student.courseStatus[courseName];
  
  const cleanCode = courseCode.toLowerCase().replace(/[^a-z0-9]/g, '');
  const cleanName = courseName.toLowerCase().replace(/[^a-z0-9]/g, '');
  
  for (const [key, val] of Object.entries(student.courseStatus)) {
    const cleanKey = key.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanKey === cleanCode || cleanKey === cleanName) {
      return val;
    }
  }
  return undefined;
};

const SKILL_TIERS = {
  // Critical (+20)
  "node.js": 20, "react": 20, "postgresql": 20, "sql": 20, "javascript": 20,
  "html": 20, "css": 20, "ssr": 20, "react native": 20, "flutter": 20, "dart": 20,
  "testing": 20, "linux": 20, "networking": 20, "python": 20, "java": 20,

  // Important (+10)
  "docker": 10, "redis": 10, "typescript": 10, "rest api": 10, "express.js": 10,
  "next.js": 10, "aws": 10, "kubernetes": 10, "microservices": 10, "system design": 10,
  "firebase": 10, "state management": 10, "ci/cd": 10, "openai api": 10, "rag": 10,

  // Bonus (+5)
  "graphql": 5, "rabbitmq": 5, "elasticsearch": 5, "vector database": 5, "langchain": 5
};

function getSkillWeight(skill) {
  const s = skill.toLowerCase().replace(/[^a-z0-9]/g, '');
  // Try direct match or key lookup
  const match = Object.keys(SKILL_TIERS).find(k => k.toLowerCase().replace(/[^a-z0-9]/g, '') === s);
  if (match) return SKILL_TIERS[match];
  return 5; // Default is bonus/standard
}

function normalizeSkill(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function slugify(str) {
  if (!str) return '';
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

exports.analyzeCareer = (student, careerGoal) => {
  const coursesDb = knowledgeCache.get('courses') || [];
  const careerRoadmaps = knowledgeCache.get('careerRoadmaps') || {};

  const industryData = careerRoadmaps[careerGoal] || {
    careerName: careerGoal,
    description: "",
    coreSkills: [],
    advancedSkills: [],
    tools: [],
    softSkills: [],
    portfolios: [],
    salaryRange: "N/A",
    marketDemand: "N/A",
    futureTrend: "N/A"
  };

  const mode = (student && student.mssv) ? 'STUDENT' : 'GUEST';

  const coreSkills = industryData.coreSkills || [];
  const advancedSkills = industryData.advancedSkills || [];
  const requiredSkills = [...coreSkills, ...advancedSkills];

  // 1. Dynamic Course Mapping (Career -> Skills -> Courses)
  // Find all courses that teach any of the required skills
  const relevantCoursesMap = new Map();
  coursesDb.forEach(course => {
    const courseSkills = [...course.skills, ...course.technologies].map(s => s.toLowerCase());
    const overlaps = requiredSkills.filter(req => 
      courseSkills.some(cs => {
        const nCs = normalizeSkill(cs);
        const nReq = normalizeSkill(req);
        return nCs.includes(nReq) || nReq.includes(nCs);
      })
    );
    
    if (overlaps.length > 0) {
      // Calculate course weight based on overlapping skills
      let courseWeight = 1; // Medium
      const maxOverlapWeight = Math.max(...overlaps.map(s => getSkillWeight(s)));
      if (maxOverlapWeight >= 20) courseWeight = 3; // Critical
      else if (maxOverlapWeight >= 10) courseWeight = 2; // Important

      relevantCoursesMap.set(course.courseCode, {
        courseId: course.courseCode,
        courseName: course.courseName,
        weight: courseWeight,
        taughtSkills: overlaps
      });
    }
  });

  const courseDetails = [];
  let maxAcademicWeight = 0;
  let passedAcademicWeight = 0;

  for (const [courseId, data] of relevantCoursesMap.entries()) {
    maxAcademicWeight += data.weight;
    let status = 'NOT_STARTED';
    
    if (mode === 'STUDENT') {
      const resolvedStatus = getStudentCourseStatus(student, courseId, data.courseName);
      if (resolvedStatus !== undefined) {
        if (resolvedStatus === 'PASSED') {
          status = 'PASSED';
          passedAcademicWeight += data.weight;
        } else if (resolvedStatus === 'FAILED') {
          status = 'FAILED';
        } else {
          status = 'IN_PROGRESS';
        }
      }
    }
    
    courseDetails.push({ 
      courseId, 
      courseName: data.courseName, 
      status, 
      skills: data.taughtSkills,
      weight: data.weight
    });
  }

  // Assign impact score for courses
  courseDetails.forEach(c => {
    c.impactScore = maxAcademicWeight > 0 ? Math.round((c.weight / maxAcademicWeight) * 30) : 0;
    c.impactLabel = c.weight >= 3 ? 'Rất cao' : (c.weight === 2 ? 'Cao' : 'Trung bình');
  });

  // 2. Compute Industry Skill Gap Analysis
  const studentAcquiredSkills = new Set();
  if (mode === 'STUDENT') {
    courseDetails.forEach(c => {
      if (c.status === 'PASSED') {
        const course = coursesDb.find(db => db.courseCode === c.courseId);
        if (course) {
          course.skills.forEach(s => studentAcquiredSkills.add(s));
          course.technologies.forEach(t => studentAcquiredSkills.add(t));
        }
      }
    });
    if (student.skills) {
      Object.keys(student.skills).forEach(s => studentAcquiredSkills.add(s));
    }
  }

  const acquiredList = Array.from(studentAcquiredSkills);
  
  const isAcquired = (skill) => {
    const nSkill = normalizeSkill(skill);
    return acquiredList.some(acquired => {
      const nAcq = normalizeSkill(acquired);
      return nAcq.includes(nSkill) || nSkill.includes(nAcq);
    });
  };

  const missingCore = coreSkills.filter(s => !isAcquired(s));
  const haveCore = coreSkills.filter(s => isAcquired(s));

  const missingAdvanced = advancedSkills.filter(s => !isAcquired(s));
  const haveAdvanced = advancedSkills.filter(s => isAcquired(s));

  let maxIndustryWeight = 0;
  let acquiredIndustryWeight = 0;
  let totalMissingWeight = 0;

  const allMissingSkills = [];
  
  requiredSkills.forEach(skill => {
    const w = getSkillWeight(skill);
    maxIndustryWeight += w;
    let skillScore = 0;
    
    let explicitSkillMatch = null;
    if (mode === 'STUDENT' && student.skills) {
      const nSkill = normalizeSkill(skill);
      explicitSkillMatch = Object.keys(student.skills).find(k => {
        const nK = normalizeSkill(k);
        return nK === nSkill || nSkill.includes(nK);
      });
    }
    
    if (explicitSkillMatch) {
      skillScore = student.skills[explicitSkillMatch];
    } else if (isAcquired(skill)) {
      skillScore = 100; 
    }
    
    if (skillScore >= 40) {
      acquiredIndustryWeight += w * (skillScore / 100);
    } else {
      totalMissingWeight += w;
      allMissingSkills.push({ skill, weight: w });
    }
  });

  allMissingSkills.sort((a, b) => b.weight - a.weight);
  const topMissingSkills = allMissingSkills.map(s => {
    return {
      skill: s.skill,
      impactScore: s.weight // Absolute impact based on tier (20, 10, 5)
    };
  });

  const missingCourses = courseDetails.filter(c => c.status !== 'PASSED');

  // 3. Compute Portfolio Coverage
  let portfolioScore = 0;
  let maxPortfolioWeight = 0;
  let acquiredPortfolioWeight = 0;

  if (mode === 'STUDENT' && student.projects && student.projects.length > 0) {
    const projectSkills = new Set();
    student.projects.forEach(p => {
      if (p.technologies) {
        p.technologies.forEach(t => projectSkills.add(t.toLowerCase()));
      }
    });

    const projectSkillsArray = Array.from(projectSkills);
    
    // Evaluate how many required career skills the student's projects cover
    requiredSkills.forEach(skill => {
      const w = getSkillWeight(skill);
      maxPortfolioWeight += w;
      const isCoveredInProject = projectSkillsArray.some(ps => ps.includes(skill.toLowerCase()) || skill.toLowerCase().includes(ps));
      if (isCoveredInProject) {
        acquiredPortfolioWeight += w;
      }
    });
    
    portfolioScore = maxPortfolioWeight > 0 ? (acquiredPortfolioWeight / maxPortfolioWeight) * 100 : 0;
  }

  // 4. Compute Behavior Score
  let behaviorScoreVal = 100; // Default good behavior if not calculated
  if (mode === 'STUDENT') {
    const bAnalysis = analyzeBehavior(student.mssv);
    // behaviorScore from behavior-engine is 0 (Good) to >1 (Bad). So let's invert it for Readiness:
    // Risk 0 = 100%, Risk 1.0 = 0%.
    behaviorScoreVal = Math.max(0, 100 - (bAnalysis.behaviorScore * 100));
  }

  // 5. Compute Internship Readiness & Career Match (V4 Formula)
  let academicScore = 0;
  let industryScore = 0;
  let readinessScore = 0;
  let readinessLevel = 'Beginner';
  let estimatedMonthsText = 'N/A';

  if (mode === 'STUDENT') {
    academicScore = maxAcademicWeight > 0 ? (passedAcademicWeight / maxAcademicWeight) * 100 : 0;
    industryScore = maxIndustryWeight > 0 ? (acquiredIndustryWeight / maxIndustryWeight) * 100 : 0;
    
    // Readiness Score = 30% Academic + 40% Industry + 20% Portfolio + 10% Behavior
    readinessScore = Math.round((academicScore * 0.3) + (industryScore * 0.4) + (portfolioScore * 0.2) + (behaviorScoreVal * 0.1));
    readinessScore = Math.min(100, Math.max(0, readinessScore));

    if (readinessScore <= 20) readinessLevel = 'Explorer';
    else if (readinessScore <= 40) readinessLevel = 'Foundation';
    else if (readinessScore <= 60) readinessLevel = 'Beginner Intern';
    else if (readinessScore <= 80) readinessLevel = 'Internship Ready';
    else readinessLevel = 'Job Ready';

    // 10 weight units roughly equals 1 week of learning. We convert to months (1 month ~ 40 weight)
    const weeks = Math.ceil(totalMissingWeight / 10);
    if (weeks === 0) {
      estimatedMonthsText = 'Đã sẵn sàng apply thực tập';
    } else if (weeks <= 4) {
      estimatedMonthsText = `${weeks}-${weeks + 1} tuần`;
    } else {
      const monthsMin = Math.floor(weeks / 4);
      const monthsMax = monthsMin + 1;
      estimatedMonthsText = `${monthsMin}-${monthsMax} tháng`;
    }
  }

  // Calculate Forecast / Projections
  const forecasts = [];
  let projectedReadiness = readinessScore;

  if (mode === 'STUDENT') {
    topMissingSkills.forEach(s => {
      s.gainedReadiness = Math.round((s.impactScore / (maxIndustryWeight || 1)) * 100 * 0.4);
    });

    topMissingSkills.slice(0, 2).forEach(s => {
      if (s.gainedReadiness > 0) {
        forecasts.push({ action: `Học xong ${s.skill}`, points: s.gainedReadiness });
        projectedReadiness += s.gainedReadiness;
      }
    });

    if (portfolioScore < 80) {
      const portfolioGain = Math.round(((100 - portfolioScore) * 0.2));
      if (portfolioGain > 0) {
        forecasts.push({ action: `Hoàn thiện dự án thực tế`, points: portfolioGain });
        projectedReadiness += portfolioGain;
      }
    }
    projectedReadiness = Math.min(100, projectedReadiness);
  }

  const progressPercent = maxAcademicWeight > 0 ? Math.round((passedAcademicWeight / maxAcademicWeight) * 100) : 0;

  return {
    mode,
    careerGoal: industryData.careerName || careerGoal,
    description: industryData.description,
    progressPercent,
    readinessScore,
    readinessLevel,
    academicProgress: courseDetails,
    missingCourses,
    topMissingSkills,
    estimatedMonthsText,
    scores: {
      academic: academicScore,
      industry: industryScore,
      portfolio: portfolioScore,
      behavior: behaviorScoreVal
    },
    forecasts,
    projectedReadiness,
    skillGap: {
      core: { have: haveCore, missing: missingCore },
      advanced: { have: haveAdvanced, missing: missingAdvanced }
    },
    industryRequirements: {
      core: coreSkills,
      advanced: advancedSkills,
      tools: industryData.tools || [],
      soft: industryData.softSkills || []
    },
    portfolios: industryData.portfolios || [],
    marketInsights: {
      salaryRange: industryData.salaryRange,
      marketDemand: industryData.marketDemand,
      futureTrend: industryData.futureTrend
    }
  };
};

exports.analyzeStudentCareer = async (goalSlug, mssv) => {
  const roadmaps = knowledgeCache.get('careerRoadmaps');
  if (!roadmaps) throw new Error("Knowledge cache not loaded");

  const careerKey = Object.keys(roadmaps).find(k => {
    const slug = slugify(k);
    if (slug === goalSlug) return true;
    if (goalSlug === 'ai-engineer' && slug === 'ai-fullstack-engineer') return true;
    return false;
  });
  if (!careerKey) return null;

  const student = await fetchStudentByMssv(mssv);
  
  // If student is not found, analyzeCareer will treat it as GUEST mode
  // and return a default analysis instead of crashing the UI.
  return analyzeCareer(student, careerKey);
};

exports.suggestBestCareers = (student) => {
  const careerRoadmaps = knowledgeCache.get('careerRoadmaps') || {};
  const coursesDb = knowledgeCache.get('courses') || [];

  if (!student) return [];

  const results = [];
  
  const studentAcquiredSkills = new Set();
  const passedCourses = Object.keys(student.courseStatus || {}).filter(courseId => student.courseStatus[courseId] === 'PASSED');
  
  passedCourses.forEach(courseId => {
    const course = coursesDb.find(db => db.courseCode === courseId);
    if (course) {
      if (course.skills) course.skills.forEach(s => studentAcquiredSkills.add(s));
      if (course.technologies) course.technologies.forEach(t => studentAcquiredSkills.add(t));
    }
  });

  if (student.skills) {
    Object.keys(student.skills).forEach(s => studentAcquiredSkills.add(s));
  }

  const acquiredList = Array.from(studentAcquiredSkills);

  for (const [careerGoal, industryData] of Object.entries(careerRoadmaps)) {
    const coreSkills = industryData.coreSkills || [];
    const advancedSkills = industryData.advancedSkills || [];
    const requiredSkills = [...coreSkills, ...advancedSkills];

    let matchCount = 0;
    requiredSkills.forEach(reqSkill => {
      // Check if student acquired this exact skill or a subset/superset
      const hasSkill = acquiredList.some(acq => 
        acq.toLowerCase() === reqSkill.toLowerCase() || 
        acq.toLowerCase().includes(reqSkill.toLowerCase()) || 
        reqSkill.toLowerCase().includes(acq.toLowerCase())
      );
      if (hasSkill) matchCount++;
    });

    const score = requiredSkills.length > 0 ? (matchCount / requiredSkills.length) * 100 : 0;
    
    results.push({
      id: careerGoal === 'AI Fullstack Engineer' ? 'ai-engineer' : slugify(careerGoal),
      careerName: careerGoal,
      matchScore: Math.round(score),
      readinessScore: Math.round(score), // using same score as readiness roughly
      score: score,
      matchCount: matchCount,
      totalRequired: requiredSkills.length
    });
  }

  results.sort((a, b) => b.score - a.score);
  return results; // Return all recommendations so UI can map readiness scores
};
