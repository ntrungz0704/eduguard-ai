// ============================================================
// EduGuard AI — Synonym Engine v1.0
// Maps all variations/aliases/slang → canonical names
// for Careers (18 paths) and Courses (34 subjects)
// ============================================================

// ────────────────────────────────────────────────────────────
// CAREER SYNONYMS — All variations → canonical career name
// ────────────────────────────────────────────────────────────
const CAREER_SYNONYMS = {
  'Frontend Developer': [
    'frontend', 'fe', 'front end', 'front-end', 'frontend dev',
    'frontend developer', 'lập trình giao diện', 'lap trinh giao dien',
    'web giao diện', 'giao diện web', 'làm giao diện',
    'fe developer', 'fe dev', 'front end developer'
  ],
  'Backend Developer': [
    'backend', 'be', 'back end', 'back-end', 'backend dev',
    'backend developer', 'lập trình server', 'lap trinh server',
    'viết api', 'api developer', 'server side',
    'be developer', 'be dev', 'back end developer'
  ],
  'Full Stack Developer': [
    'fullstack', 'full stack', 'full-stack', 'fs',
    'fullstack dev', 'fullstack developer', 'full stack developer'
  ],
  'React Developer': [
    'react', 'reactjs', 'react.js', 'react dev', 'react developer',
    'lập trình react', 'lap trinh react'
  ],
  'React Native Developer': [
    'react native', 'reactnative', 'react-native', 'rn developer',
    'react native dev', 'lập trình react native', 'mobile react'
  ],
  'Next.js Developer': [
    'nextjs', 'next.js', 'next js', 'next', 'nextjs dev',
    'next.js developer', 'lập trình nextjs'
  ],
  'Node.js Developer': [
    'nodejs', 'node.js', 'node js', 'node', 'nodejs dev',
    'node.js developer', 'lập trình nodejs', 'lap trinh nodejs'
  ],
  'Flutter Developer': [
    'flutter', 'dart', 'flutter dev', 'flutter developer',
    'lập trình flutter', 'lap trinh flutter', 'mobile flutter'
  ],
  'DevOps Engineer': [
    'devops', 'dev ops', 'dev-ops', 'devops engineer',
    'kỹ sư devops', 'ky su devops', 'ci cd', 'ci/cd'
  ],
  'Cloud Engineer': [
    'cloud', 'cloud engineer', 'kỹ sư cloud', 'ky su cloud',
    'aws', 'azure', 'gcp', 'cloud computing'
  ],
  'QA Automation Engineer': [
    'qa', 'qa automation', 'qa auto', 'tester', 'testing',
    'kiểm thử', 'kiem thu', 'automation testing', 'qa engineer',
    'tester automation', 'kiểm thử tự động', 'kiem thu tu dong'
  ],
  'Prompt Engineer': [
    'prompt', 'prompt engineer', 'prompt engineering',
    'kỹ sư prompt', 'ky su prompt', 'ai prompt'
  ],
  'Software Engineer': [
    'software engineer', 'swe', 'kỹ sư phần mềm', 'ky su phan mem',
    'lập trình viên', 'lap trinh vien', 'developer', 'coder'
  ],
  'Software Architect': [
    'software architect', 'architect', 'kiến trúc sư',
    'kiến trúc sư phần mềm', 'kien truc su', 'system architect'
  ],
  'Solutions Engineer': [
    'solutions engineer', 'solution engineer', 'kỹ sư giải pháp',
    'ky su giai phap', 'pre-sales engineer'
  ],
  'UI Engineer': [
    'ui engineer', 'ui dev', 'ui developer', 'kỹ sư ui',
    'ky su ui', 'ui/ux', 'ux designer', 'ui ux'
  ],
  'AI Fullstack Engineer': [
    'ai fullstack', 'ai full stack', 'ai full-stack', 'ai engineer',
    'kỹ sư ai', 'ky su ai', 'machine learning', 'ml engineer',
    'ai developer', 'ai dev', 'trí tuệ nhân tạo'
  ],
  'AI Frontend Engineer': [
    'ai frontend', 'ai front-end', 'ai front end',
    'ai frontend engineer', 'ai fe'
  ]
};

// ────────────────────────────────────────────────────────────
// COURSE SYNONYMS — Extend existing SUBJECT_ALIASES
// ────────────────────────────────────────────────────────────
const COURSE_SYNONYMS = {
  'COM108': [
    'nhập môn lập trình', 'nhap mon lap trinh', 'nmlt', 'com108',
    'lập trình cơ bản', 'lap trinh co ban', 'intro programming',
    'basic programming', 'lập trình căn bản', 'môn lập trình đầu'
  ],
  'WEB104': [
    'xây dựng trang web', 'html css', 'web cơ bản', 'web104',
    'tin học cơ sở', 'web căn bản', 'làm web cơ bản',
    'html', 'css cơ bản'
  ],
  'WEB206': [
    'javascript', 'js', 'javascript nâng cao', 'web206',
    'lập trình js', 'lap trinh js', 'js nâng cao',
    'lập trình javascript cơ sở', 'javascript cơ sở'
  ],
  'COM201': [
    'cơ sở dữ liệu', 'database', 'sql', 'com201',
    'csdt', 'csdl', 'sql server', 'co so du lieu'
  ],
  'PHP1': [
    'php1', 'php 1', 'lập trình php', 'lap trinh php',
    'backend php', 'php cơ bản', 'php co ban'
  ],
  'PHP2': [
    'php2', 'php 2', 'php nâng cao', 'php nang cao'
  ],
  'PRO101': [
    'dự án 1', 'du an 1', 'project 1', 'pro101',
    'capstone', 'đồ án', 'do an', 'tktw'
  ],
  'PRO124': [
    'dự án mẫu', 'pro124', 'framework', 'du an mau'
  ],
  'MOB101': [
    'mobile', 'lập trình di động', 'mob101',
    'lap trinh di dong', 'lập trình mobile'
  ]
};

// ────────────────────────────────────────────────────────────
// Build reverse lookup maps for O(1) resolution
// ────────────────────────────────────────────────────────────
const _careerLookup = new Map();
for (const [canonical, aliases] of Object.entries(CAREER_SYNONYMS)) {
  // Add canonical name itself (lowercased)
  _careerLookup.set(canonical.toLowerCase(), canonical);
  for (const alias of aliases) {
    _careerLookup.set(alias.toLowerCase(), canonical);
  }
}

const _courseLookup = new Map();
for (const [canonical, aliases] of Object.entries(COURSE_SYNONYMS)) {
  _courseLookup.set(canonical.toLowerCase(), canonical);
  for (const alias of aliases) {
    _courseLookup.set(alias.toLowerCase(), canonical);
  }
}

/**
 * Resolve any career input to its canonical name.
 * @param {string} input - Raw user input (e.g. "fe", "react", "fronend")
 * @returns {string|null} Canonical career name or null
 */
function resolveCareer(input) {
  if (!input) return null;
  const normalized = input.toLowerCase().trim();
  
  // Direct lookup
  if (_careerLookup.has(normalized)) {
    return _careerLookup.get(normalized);
  }
  
  // Substring match — check if input contains any synonym
  for (const [alias, canonical] of _careerLookup.entries()) {
    if (alias.length >= 3 && normalized.includes(alias)) {
      return canonical;
    }
  }
  
  return null;
}

/**
 * Resolve any course input to its canonical course ID.
 * @param {string} input - Raw user input (e.g. "nhập môn lập trình", "sql")
 * @returns {string|null} Canonical course ID or null
 */
function resolveCourse(input) {
  if (!input) return null;
  const normalized = input.toLowerCase().trim();
  
  // Direct lookup
  if (_courseLookup.has(normalized)) {
    return _courseLookup.get(normalized);
  }
  
  // Substring match
  for (const [alias, canonical] of _courseLookup.entries()) {
    if (alias.length >= 3 && normalized.includes(alias)) {
      return canonical;
    }
  }
  
  return null;
}

/**
 * Get all known career names.
 * @returns {string[]}
 */
function getAllCareerNames() {
  return Object.keys(CAREER_SYNONYMS);
}

/**
 * Get all synonyms for a specific career.
 * @param {string} career - Canonical career name
 * @returns {string[]}
 */
function getCareerSynonyms(career) {
  return CAREER_SYNONYMS[career] || [];
}

/**
 * Get all known synonym keywords as a flat list (for fuzzy matching dictionary).
 * @returns {string[]}
 */
function getAllCareerKeywords() {
  const keywords = [];
  for (const aliases of Object.values(CAREER_SYNONYMS)) {
    keywords.push(...aliases);
  }
  return keywords;
}

module.exports = {
  CAREER_SYNONYMS,
  COURSE_SYNONYMS,
  resolveCareer,
  resolveCourse,
  getAllCareerNames,
  getCareerSynonyms,
  getAllCareerKeywords,
  _careerLookup,
  _courseLookup
};
