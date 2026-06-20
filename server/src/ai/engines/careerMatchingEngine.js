const PASS_FAIL_STATUSES = new Set(['PASSED', 'FAILED']);

const FPT_POLYTECHNIC_COURSE_SKILL_MATRIX = Object.freeze({
  COM1071: ['Office Productivity', 'Information Search'],
  VIE103: ['Discipline'],
  PDP102: ['Active Learning', 'Time Management'],
  COM108: ['Programming Logic'],
  ITI101: ['IT Fundamentals'],
  VIE104: ['Discipline'],
  ENT1128: ['English Communication'],
  COM2012: ['Database', 'SQL'],
  WEB1013: ['HTML', 'CSS'],
  ENT123: ['English Communication'],
  WEB1043: ['JavaScript', 'DOM'],
  WEB108: ['PHP'],
  ENT213: ['English Communication'],
  VIE108: ['Critical Thinking'],
  WEB3023: ['Responsive Design', 'HTML', 'CSS'],
  WEB2014: ['PHP', 'MVC'],
  VIE1026: ['Legal Compliance'],
  PDP103: ['Self Development'],
  WEB105: ['UIUX', 'Design Thinking'],
  WEB2041: ['CRUD', 'Deployment'],
  ENT223: ['Professional Communication'],
  WEB1023: ['Website Administration'],
  WEB2055: ['Digital Marketing', 'Analytics'],
  WEB501: ['JavaScript', 'ECMAScript'],
  WEB2063: ['JavaScript', 'API', 'REST API'],
  PRO1014: ['Project Management', 'Git', 'Teamwork'],
  WEB503: ['NodeJS', 'Express', 'REST API', 'Database'],
  WEB502: ['TypeScript'],
  PDP104: ['Professional Skills'],
  SYB3013: ['Business'],
  WEB2081: ['React', 'Component', 'State Management'],
  WEB2091: ['React', 'State Management'],
  PRO116: ['Industry Experience'],
  PRO2201: ['Fullstack Project', 'Deployment']
});

const CAREER_REQUIREMENT_MATRIX = Object.freeze({
  'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'Responsive Design', 'TypeScript'],
  'Backend Developer': ['NodeJS', 'Express', 'PHP', 'Database', 'SQL', 'REST API'],
  'Full Stack Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'NodeJS', 'Express', 'Database', 'REST API'],
  'Fullstack Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'NodeJS', 'Express', 'Database', 'REST API'],
  'UIUX Designer': ['UIUX', 'Design Thinking', 'HTML', 'CSS'],
  'UI/UX Designer': ['UIUX', 'Design Thinking', 'HTML', 'CSS']
});

const CAREER_ALIASES = Object.freeze({
  'fullstack-developer': 'Fullstack Developer',
  'full-stack-developer': 'Full Stack Developer',
  'ui-ux-designer': 'UI/UX Designer',
  'uiux-designer': 'UIUX Designer'
});

const ROADMAP_RULES = Object.freeze({
  React: ['React', 'Component', 'Hooks'],
  TypeScript: ['TypeScript Basics', 'Generics', 'Interfaces'],
  NodeJS: ['NodeJS', 'Express', 'REST API', 'JWT'],
  Express: ['Express', 'REST API', 'JWT'],
  'REST API': ['REST API', 'HTTP Methods', 'API Testing'],
  Database: ['Database Design', 'SQL Practice'],
  SQL: ['SQL Joins', 'Query Optimization'],
  HTML: ['Semantic HTML'],
  CSS: ['CSS Layouts', 'Flexbox', 'Grid'],
  JavaScript: ['JavaScript Core', 'DOM', 'Async JavaScript'],
  'Responsive Design': ['Responsive Design', 'Mobile-first Layout'],
  UIUX: ['User Research', 'Wireframing', 'Prototype Testing'],
  'Design Thinking': ['Design Thinking', 'User Journey Mapping']
});

const LEARNING_BOARD_SKILLS = Object.freeze({
  'Frontend Developer': ['HTML', 'CSS', 'JavaScript', 'Responsive Design', 'React', 'TypeScript', 'Git', 'REST API'],
  'Backend Developer': ['NodeJS', 'Express', 'PHP', 'Database', 'SQL', 'REST API', 'Git', 'JWT'],
  'Full Stack Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'NodeJS', 'Express', 'Database', 'REST API', 'Git'],
  'Fullstack Developer': ['HTML', 'CSS', 'JavaScript', 'React', 'TypeScript', 'NodeJS', 'Express', 'Database', 'REST API', 'Git'],
  'UIUX Designer': ['UIUX', 'Design Thinking', 'HTML', 'CSS', 'Wireframing', 'Prototype Testing'],
  'UI/UX Designer': ['UIUX', 'Design Thinking', 'HTML', 'CSS', 'Wireframing', 'Prototype Testing']
});

function slugify(str) {
  return String(str || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function normalizeCourseCode(code) {
  return String(code || '').toUpperCase().trim();
}

function resolveCareerName(careerNameOrSlug) {
  const raw = String(careerNameOrSlug || '').trim();
  if (!raw) return null;
  const direct = Object.keys(CAREER_REQUIREMENT_MATRIX).find(name => name.toLowerCase() === raw.toLowerCase());
  if (direct) return direct;
  const slug = slugify(raw);
  if (CAREER_ALIASES[slug]) return CAREER_ALIASES[slug];
  return Object.keys(CAREER_REQUIREMENT_MATRIX).find(name => slugify(name) === slug) || null;
}

function getScoreValue(score) {
  const candidates = [score?.value, score?.computedScore, score?.rawScore, score?.final];
  const found = candidates.find(v => v !== null && v !== undefined && !Number.isNaN(Number(v)));
  return found === undefined ? null : Number(found);
}

function normalizeTranscriptScores(input) {
  if (Array.isArray(input)) {
    return input
      .map(score => {
        const courseId = normalizeCourseCode(score.course?.id || score.course?.courseCode || score.courseId);
        return {
          courseId,
          courseName: score.course?.name || score.course?.courseName || courseId,
          score: getScoreValue(score),
          status: String(score.status || '').toUpperCase(),
          credits: score.course?.credits ?? score.credits ?? null,
          semester: score.semester || null
        };
      })
      .filter(row => row.courseId && PASS_FAIL_STATUSES.has(row.status) && row.score !== null);
  }

  return Object.entries(input || {}).map(([courseId, score]) => ({
    courseId: normalizeCourseCode(courseId),
    courseName: normalizeCourseCode(courseId),
    score: score === null || score === undefined ? null : Number(score),
    status: score === null || score === undefined ? 'NOT_STARTED' : (Number(score) >= 5 ? 'PASSED' : 'FAILED'),
    credits: null,
    semester: null
  })).filter(row => row.courseId && PASS_FAIL_STATUSES.has(row.status) && row.score !== null);
}

function buildSkillScores(transcriptRows) {
  const skillScores = {};
  const mappedTranscript = [];

  transcriptRows.forEach(row => {
    const skills = FPT_POLYTECHNIC_COURSE_SKILL_MATRIX[row.courseId] || [];
    if (skills.length === 0) return;

    mappedTranscript.push({
      course: row.courseId,
      courseName: row.courseName,
      score: row.score,
      status: row.status,
      credits: row.credits,
      semester: row.semester,
      skills
    });

    skills.forEach(skill => {
      const current = skillScores[skill];
      if (!current || row.score > current.score) {
        skillScores[skill] = {
          skill,
          score: row.score,
          status: row.status,
          sourceCourse: row.courseId,
          sourceCourseName: row.courseName,
          semester: row.semester
        };
      }
    });
  });

  return { skillScores, mappedTranscript };
}

function getConfidence(coverage) {
  if (coverage >= 80) return 'High';
  if (coverage >= 50) return 'Medium';
  return 'Low';
}

function buildRoadmap(missingSkills) {
  const roadmap = [];
  missingSkills.forEach(item => {
    const skill = typeof item === 'string' ? item : item.skill;
    (ROADMAP_RULES[skill] || [skill]).forEach(step => {
      if (!roadmap.includes(step)) roadmap.push(step);
    });
  });
  if (!roadmap.includes('Git')) roadmap.push('Git');
  return roadmap;
}

function analyzeCareerFromTranscript(transcriptInput, careerNameOrSlug) {
  const careerName = resolveCareerName(careerNameOrSlug);
  if (!careerName) return { missing_data: true, insufficientEvidence: false };

  const requiredSkills = CAREER_REQUIREMENT_MATRIX[careerName];
  const transcriptRows = normalizeTranscriptScores(transcriptInput);
  const { skillScores, mappedTranscript } = buildSkillScores(transcriptRows);

  let totalScore = 0;
  let learnedCount = 0;
  const matchedSkills = [];
  const missingSkills = [];
  const skillScoreRows = [];

  requiredSkills.forEach(skill => {
    const learned = skillScores[skill];
    if (learned) {
      learnedCount += 1;
      totalScore += learned.score;
      const row = {
        skill,
        score: learned.score,
        status: learned.status,
        sourceCourse: learned.sourceCourse,
        sourceCourseName: learned.sourceCourseName,
        semester: learned.semester
      };
      skillScoreRows.push(row);
      matchedSkills.push(row);
      return;
    }

    const missing = { skill, score: null, status: 'MISSING', sourceCourse: null };
    skillScoreRows.push(missing);
    missingSkills.push(missing);
  });

  const denominator = requiredSkills.length * 10;
  const matchRate = denominator > 0 ? Math.round((totalScore / denominator) * 100) : 0;
  const coverage = requiredSkills.length > 0 ? Math.round((learnedCount / requiredSkills.length) * 100) : 0;
  const strengthRows = skillScoreRows.filter(row => row.score !== null && row.score >= 8);
  const weaknessRows = skillScoreRows.filter(row => row.score === null || row.score < 6);
  const strengths = strengthRows.map(row => row.skill);
  const weaknesses = weaknessRows.map(row => row.skill);

  return {
    career: careerName,
    career_name: careerName,
    matchRate,
    backend_match_rate: matchRate,
    coverage,
    confidence: getConfidence(coverage),
    strengths,
    weaknesses,
    skillScores: skillScoreRows,
    roadmap: buildRoadmap(weaknessRows),
    requiredSkills,
    required_tech_stack: requiredSkills,
    mapped_transcript: mappedTranscript,
    matchedSkills,
    missingSkills,
    learnedCount,
    totalRequired: requiredSkills.length,
    insufficientEvidence: false
  };
}

function analyzeAllCareersFromTranscript(transcriptInput) {
  const uniqueCareers = ['Frontend Developer', 'Backend Developer', 'Fullstack Developer', 'UI/UX Designer'];
  return uniqueCareers
    .map(career => analyzeCareerFromTranscript(transcriptInput, career))
    .sort((a, b) => b.matchRate - a.matchRate || b.coverage - a.coverage || a.career.localeCompare(b.career));
}

function calculateMatchRate(studentScores, careerName) {
  return analyzeCareerFromTranscript(studentScores, careerName);
}

function generateLearningTasks(careerNameOrSlug, analysis = null) {
  const careerName = resolveCareerName(careerNameOrSlug) || careerNameOrSlug;
  const skills = LEARNING_BOARD_SKILLS[careerName] || CAREER_REQUIREMENT_MATRIX[careerName] || [];
  const doneSkills = new Set((analysis?.matchedSkills || [])
    .filter(item => item.score !== null && item.score >= 6)
    .map(item => item.skill.toLowerCase()));
  const inProgressSkills = new Set((analysis?.skillScores || [])
    .filter(item => item.score !== null && item.score < 6)
    .map(item => item.skill.toLowerCase()));

  return skills.map((skill, index) => {
    const clean = skill.toLowerCase();
    const status = doneSkills.has(clean) ? 'DONE' : (inProgressSkills.has(clean) ? 'IN_PROGRESS' : 'TODO');
    return {
      id: `${slugify(careerName)}_task_${index}`,
      title: skill,
      type: (CAREER_REQUIREMENT_MATRIX[careerName] || []).includes(skill) ? 'core' : 'advanced',
      status,
      impact: skill === 'Git' ? 6 : 8,
      duration: status === 'DONE' ? 'Đã học trong chương trình' : '4-6 ngày',
      started_at: status === 'IN_PROGRESS' ? new Date().toISOString().split('T')[0] : null,
      completed_at: status === 'DONE' ? new Date().toISOString().split('T')[0] : null,
      updated_at: new Date().toISOString().split('T')[0],
      github: null,
      demo: null,
      screenshot: null,
      evidenceStatus: status === 'DONE' ? 'VERIFIED' : 'NONE',
      verified: status === 'DONE',
      points: 0
    };
  });
}

module.exports = {
  FPT_POLYTECHNIC_COURSE_SKILL_MATRIX,
  SKILL_MATRIX: FPT_POLYTECHNIC_COURSE_SKILL_MATRIX,
  CAREER_REQUIREMENT_MATRIX,
  CAREER_MATRIX: CAREER_REQUIREMENT_MATRIX,
  LEARNING_BOARD_SKILLS,
  PASS_FAIL_STATUSES,
  calculateMatchRate,
  analyzeCareerFromTranscript,
  analyzeAllCareersFromTranscript,
  buildSkillScores,
  generateLearningTasks,
  normalizeTranscriptScores,
  resolveCareerName,
  slugify
};
