const {
  CAREER_REQUIREMENT_MATRIX,
  SKILL_MATRIX,
  analyzeCareerFromTranscript,
  analyzeAllCareersFromTranscript,
  resolveCareerName,
  slugify
} = require('../../ai/engines/careerMatchingEngine');

function transcriptFromStudent(student) {
  return Array.isArray(student?.scores) ? student.scores : [];
}

function getReadinessLevel(score) {
  if (score >= 80) return 'High';
  if (score >= 50) return 'Medium';
  return 'Low';
}

function estimateMonths(missingCount) {
  if (missingCount <= 0) return '0 tháng';
  if (missingCount <= 2) return '1-2 tháng';
  if (missingCount <= 4) return '2-3 tháng';
  return '3-6 tháng';
}

function buildPortfolioSuggestions(careerGoal, missingSkills) {
  const skills = missingSkills.slice(0, 4);
  return [
    {
      name: `${careerGoal} Portfolio Project`,
      description: 'Dự án thực hành tập trung vào các kỹ năng còn thiếu theo transcript.',
      learnToApply: skills.length > 0 ? skills : ['Git', 'REST API'],
      evidence: ['GitHub repository', 'Live demo']
    }
  ];
}

function toAdvisorShape(student, careerGoal, base) {
  const missingNames = base.missingSkills.map(item => item.skill);
  const matchedNames = base.matchedSkills.map(item => item.skill);
  const skillDetails = base.skillScores.map(item => ({
    skill: item.skill,
    score: item.score,
    status: item.status,
    sourceCourse: item.sourceCourse
  }));

  const academicProgress = base.mapped_transcript.map(item => ({
    courseId: item.course,
    courseName: item.courseName || item.course,
    score: item.score,
    status: item.status,
    skills: item.skills
  }));

  const topMissingSkills = base.missingSkills.map(item => ({
    skill: item.skill,
    gainedReadiness: Math.round(100 / base.totalRequired),
    reason: 'Kỹ năng yêu cầu chưa có điểm từ môn PASSED/FAILED trong transcript.'
  }));

  return {
    mode: student?.mssv ? 'STUDENT' : 'GUEST',
    careerGoal: base.career,
    career: base.career,
    career_name: base.career,
    matchRate: base.matchRate,
    matchScore: base.matchRate,
    readinessScore: base.matchRate,
    score: base.matchRate,
    progressPercent: base.coverage,
    coverage: base.coverage,
    confidence: base.confidence,
    readinessLevel: getReadinessLevel(base.matchRate),
    strengths: base.strengths,
    weaknesses: base.weaknesses,
    skillScores: skillDetails,
    matchedSkillDetails: base.matchedSkills,
    missingSkillDetails: base.missingSkills,
    matchedSkills: matchedNames,
    missingSkills: missingNames,
    evidence: base.matchedSkills.map(item => ({
      courseId: item.sourceCourse,
      courseName: item.sourceCourseName || item.sourceCourse,
      skills: [item.skill],
      score: item.score
    })),
    insufficientEvidence: false,
    roadmap: base.roadmap.map((step, index) => ({
      title: step,
      skills: [step],
      order: index + 1
    })),
    roadmapSteps: base.roadmap,
    skillGap: {
      core: { have: matchedNames, missing: missingNames },
      advanced: { have: [], missing: [] }
    },
    industryRequirements: {
      core: base.requiredSkills,
      advanced: [],
      tools: [],
      soft: []
    },
    academicProgress,
    missingCourses: [],
    topMissingSkills,
    portfolios: buildPortfolioSuggestions(base.career, missingNames),
    estimatedWeeks: Math.max(0, missingNames.length * 2),
    estimatedMonthsText: estimateMonths(missingNames.length),
    projectedReadiness: Math.min(100, base.matchRate + topMissingSkills.slice(0, 3).reduce((sum, item) => sum + item.gainedReadiness, 0)),
    forecasts: topMissingSkills.slice(0, 3).map(item => ({
      skill: item.skill,
      points: item.gainedReadiness,
      message: `Hoàn thành ${item.skill} sẽ tăng coverage cho ${base.career}.`
    })),
    scores: {
      academic: base.matchRate,
      industry: base.coverage,
      portfolio: 0,
      behavior: 0
    },
    requiredSkills: base.requiredSkills,
    mapped_transcript: base.mapped_transcript,
    totalRequired: base.totalRequired,
    learnedCount: base.learnedCount
  };
}

function analyzeCareer(student, careerGoal) {
  const resolved = resolveCareerName(careerGoal);
  if (!resolved) {
    return {
      insufficientEvidence: false,
      careerGoal,
      matchRate: 0,
      readinessScore: 0,
      progressPercent: 0,
      coverage: 0,
      confidence: 'Low',
      matchedSkills: [],
      missingSkills: [],
      skillGap: { core: { have: [], missing: [] }, advanced: { have: [], missing: [] } },
      industryRequirements: { core: [], advanced: [], tools: [], soft: [] },
      academicProgress: [],
      missingCourses: [],
      topMissingSkills: [],
      portfolios: [],
      roadmap: [],
      scores: { academic: 0, industry: 0, portfolio: 0, behavior: 0 }
    };
  }

  const base = analyzeCareerFromTranscript(transcriptFromStudent(student), resolved);
  return toAdvisorShape(student, resolved, base);
}

function suggestBestCareers(student) {
  if (!student) return [];
  return analyzeAllCareersFromTranscript(transcriptFromStudent(student)).map(base => {
    const advisor = toAdvisorShape(student, base.career, base);
    return {
      id: slugify(base.career),
      careerName: base.career,
      matchScore: base.matchRate,
      readinessScore: base.matchRate,
      score: base.matchRate,
      matchCount: base.learnedCount,
      totalRequired: base.totalRequired,
      coverage: base.coverage,
      confidence: base.confidence,
      insufficientEvidence: false,
      matchedSkills: advisor.matchedSkills,
      missingSkills: advisor.missingSkills,
      strengths: base.strengths,
      weaknesses: base.weaknesses,
      skillScores: advisor.skillScores,
      roadmap: advisor.roadmapSteps,
      evidence: advisor.evidence
    };
  });
}

function calculateStyleMatch() {
  return 0;
}

exports.analyzeCareer = analyzeCareer;
exports.suggestBestCareers = suggestBestCareers;
exports.analyzeStudentCareer = async () => null;
exports.calculateStyleMatch = calculateStyleMatch;
exports.SKILL_MATRIX = SKILL_MATRIX;
exports.CAREER_MATRIX = CAREER_REQUIREMENT_MATRIX;
exports.evaluateSkillScore = score => {
  if (score === null || score === undefined) return 'UNKNOWN';
  if (score >= 8) return 'MASTERED';
  if (score >= 6) return 'GOOD';
  return 'WEAK';
};
