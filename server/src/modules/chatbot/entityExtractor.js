// ============================================================
// EduGuard AI — Entity Extractor (v2.0 — Production-Grade)
// Extracts structured entities from natural language messages
// with robust MSSV normalization and fuzzy subject matching
// ============================================================

// ────────────────────────────────────────────────────────────
// SUBJECT ALIAS MAP — Fuzzy matching for course names
// ────────────────────────────────────────────────────────────
const SUBJECT_ALIASES = {
  // COM108
  'nhập môn lập trình': 'COM108', 'nhap mon lap trinh': 'COM108',
  'lập trình cơ bản': 'COM108', 'lap trinh co ban': 'COM108',
  'nmlt': 'COM108', 'com108': 'COM108',

  // WEB104
  'xây dựng trang web': 'WEB104', 'html css': 'WEB104',
  'web cơ bản': 'WEB104', 'web104': 'WEB104', 'tin học cơ sở': 'WEB104',

  // WEB206
  'javascript': 'WEB206', 'js': 'WEB206', 'javascript nâng cao': 'WEB206',
  'web206': 'WEB206', 'lập trình js': 'WEB206', 'lap trinh js': 'WEB206',

  // COM201
  'cơ sở dữ liệu': 'COM201', 'database': 'COM201', 'sql': 'COM201',
  'com201': 'COM201', 'csdt': 'COM201', 'sql server': 'COM201',

  // PHP1
  'php1': 'PHP1', 'php 1': 'PHP1', 'lập trình php': 'PHP1',
  'lap trinh php': 'PHP1', 'backend php': 'PHP1', 'php cơ bản': 'PHP1',

  // PHP2
  'php2': 'PHP2', 'php 2': 'PHP2', 'php nâng cao': 'PHP2',

  // PRO101
  'dự án 1': 'PRO101', 'du an 1': 'PRO101', 'project 1': 'PRO101',
  'pro101': 'PRO101', 'capstone': 'PRO101', 'đồ án': 'PRO101',

  // PRO124
  'dự án mẫu': 'PRO124', 'pro124': 'PRO124', 'framework': 'PRO124',

  // MOB
  'mobile': 'MOB101', 'lập trình di động': 'MOB101', 'mob101': 'MOB101',

  // General aliases
  'tktw': 'PRO101', 'thiết kế trang web': 'PRO101',
};

/**
 * Extract MSSV (Student ID) from a message — Production-grade normalizer.
 *
 * Handles ALL variations:
 *   - PS47261, ps47261, Ps47261
 *   - ps 47261, PS 47261
 *   - 47261 (pure 5 digits)
 *   - sv 47261, sv47261, SV 47261
 *   - mssv 47261, MSSV 47261
 *   - "phân tích 47381", "dự đoán ps47261"
 *   - "bạn ps47261", "em 47261"
 *
 * @param {string} message
 * @returns {string|null} Normalized MSSV (uppercase, e.g. PS47261) or null
 */
function extractMssv(message) {
  if (!message) return null;
  const msg = message.trim();

  // Pattern 1: Standard MSSV format with optional space — PS47261, ps 47261, PC12345
  const standardMatch = msg.match(/\b(PS|PC|PK|PD)\s*(\d{5})\b/i);
  if (standardMatch) {
    return `${standardMatch[1].toUpperCase()}${standardMatch[2]}`;
  }

  // Pattern 2: Prefixed with "sv", "mssv", "sinh viên", "msv" + optional space + digits
  const prefixMatch = msg.match(/(?:sv|mssv|msv|sinh\s*viên|sinh\s*vien|em|bạn|ban)\s*[:\s]?\s*((?:PS|PC|PK|PD)\s*\d{5}|\d{5})\b/i);
  if (prefixMatch) {
    const val = prefixMatch[1].replace(/\s+/g, '').toUpperCase();
    if (/^\d{5}$/.test(val)) return `PS${val}`;
    const m = val.match(/(PS|PC|PK|PD)(\d{5})/);
    if (m) return `${m[1]}${m[2]}`;
  }

  // Pattern 3: Action verb + number context — "phân tích 47381", "dự đoán 47261"
  const actionMatch = msg.match(/(?:phân tích|đánh giá|xem|dự đoán|dự báo|risk|check|kiểm tra|phân tich|danh gia|du doan)\s+(?:sv\s*|sinh viên\s*|bạn\s*|em\s*)?(?:(PS|PC|PK|PD)\s*)?(\d{5})\b/i);
  if (actionMatch) {
    const prefix = actionMatch[1] ? actionMatch[1].toUpperCase() : 'PS';
    return `${prefix}${actionMatch[2]}`;
  }

  // Pattern 4: Standalone 5 digits (only if the message is short or digits are prominent)
  // Must be careful not to match random numbers in longer texts
  const digitsOnly = msg.match(/\b(\d{5})\b/);
  if (digitsOnly) {
    // If the message is short (< 40 chars) or contains student-related keywords, treat as MSSV
    const hasStudentContext = /(?:phân tích|đánh giá|xem|sv|sinh viên|risk|dự đoán|student|mssv|em|bạn|đứa|thằng|cô|cậu|nhỏ)/i.test(msg);
    if (msg.length < 40 || hasStudentContext) {
      return `PS${digitsOnly[1]}`;
    }
  }

  return null;
}

/**
 * Extract a Course/Subject ID from a message.
 * Supports both direct course codes (COM108) and fuzzy aliases (lập trình php → PHP1)
 * @param {string} message
 * @returns {string|null}
 */
function extractCourseId(message) {
  if (!message) return null;

  // Direct course code match: 2-4 uppercase letters + 3 digits
  const msgUpper = message.toUpperCase();
  const directMatch = msgUpper.match(/\b[A-Z]{2,4}\d{3}\b/);
  if (directMatch) return directMatch[0];

  // Fuzzy alias matching
  const msgLower = message.toLowerCase().trim();
  for (const [alias, courseId] of Object.entries(SUBJECT_ALIASES)) {
    if (msgLower.includes(alias)) {
      return courseId;
    }
  }

  return null;
}

/**
 * Career keyword-to-careerName mapping for all 18 career paths.
 * Order matters: more specific patterns must come before broader ones.
 */
const CAREER_KEYWORDS = [
  // Specific compound names first
  { keys: ['ai fullstack', 'ai full stack', 'ai full-stack'], career: 'AI Fullstack Engineer' },
  { keys: ['ai frontend', 'ai front-end', 'ai front end'], career: 'AI Frontend Engineer' },
  { keys: ['react native', 'reactnative'], career: 'React Native Developer' },
  { keys: ['next.js', 'nextjs', 'next js'], career: 'Next.js Developer' },
  { keys: ['node.js', 'nodejs', 'node js'], career: 'Node.js Developer' },
  { keys: ['full stack', 'fullstack', 'full-stack'], career: 'Full Stack Developer' },
  { keys: ['software architect', 'kiến trúc sư phần mềm', 'architect'], career: 'Software Architect' },
  { keys: ['solutions engineer', 'kỹ sư giải pháp', 'solution engineer'], career: 'Solutions Engineer' },
  { keys: ['software engineer', 'kỹ sư phần mềm', 'swe'], career: 'Software Engineer' },
  { keys: ['qa automation', 'qa auto', 'tester automation', 'automation testing', 'kiểm thử tự động'], career: 'QA Automation Engineer' },
  { keys: ['prompt engineer', 'kỹ sư prompt', 'prompt'], career: 'Prompt Engineer' },
  { keys: ['cloud engineer', 'kỹ sư cloud', 'cloud'], career: 'Cloud Engineer' },
  { keys: ['devops', 'dev ops', 'dev-ops'], career: 'DevOps Engineer' },
  { keys: ['flutter', 'dart'], career: 'Flutter Developer' },
  { keys: ['react developer', 'react dev', 'lập trình react'], career: 'React Developer' },
  { keys: ['ui engineer', 'ui dev', 'kỹ sư ui'], career: 'UI Engineer' },
  { keys: ['frontend', 'front-end', 'front end', 'lập trình giao diện', 'fe developer'], career: 'Frontend Developer' },
  { keys: ['backend', 'back-end', 'back end', 'lập trình server', 'be developer'], career: 'Backend Developer' },
];

/**
 * Extract Career Goal from a message.
 * Supports all 18 career paths in career-roadmaps.json.
 * @param {string} message
 * @returns {string|null}
 */
function extractCareerGoal(message) {
  if (!message) return null;
  const msgLower = message.toLowerCase().trim();
  
  for (const entry of CAREER_KEYWORDS) {
    if (entry.keys.some(k => msgLower.includes(k))) {
      return entry.career;
    }
  }
  
  return null;
}

/**
 * Extract all Course IDs found in the message.
 * @param {string} message
 * @returns {string[]}
 */
function extractAllCourseIds(message) {
  if (!message) return [];
  const results = new Set();

  // Direct matches
  const msgUpper = message.toUpperCase();
  const matches = msgUpper.match(/\b[A-Z]{2,4}\d{3}\b/g);
  if (matches) matches.forEach(m => results.add(m));

  // Alias matches
  const msgLower = message.toLowerCase().trim();
  for (const [alias, courseId] of Object.entries(SUBJECT_ALIASES)) {
    if (msgLower.includes(alias)) {
      results.add(courseId);
    }
  }

  return [...results];
}

/**
 * Extract GPA reference thresholds from a message.
 * Examples: "gpa dưới 5", "gpa < 6.5", "gpa yếu"
 * @param {string} message
 * @returns {{ threshold: number|null, comparison: string|null }}
 */
function extractGpaRef(message) {
  if (!message) return { threshold: null, comparison: null };
  const msgLower = message.toLowerCase();

  // Numeric threshold: "gpa < 5.5", "gpa dưới 6", "điểm thấp hơn 7"
  const numMatch = msgLower.match(/(?:gpa|điểm)\s*(?:<|dưới|thấp hơn|nhỏ hơn|<=)\s*(\d+(?:\.\d+)?)/);
  if (numMatch) {
    return { threshold: parseFloat(numMatch[1]), comparison: 'lt' };
  }

  const numMatchGt = msgLower.match(/(?:gpa|điểm)\s*(?:>|trên|cao hơn|lớn hơn|>=)\s*(\d+(?:\.\d+)?)/);
  if (numMatchGt) {
    return { threshold: parseFloat(numMatchGt[1]), comparison: 'gt' };
  }

  // Qualitative keywords
  if (/gpa\s+(?:yếu|thấp|kém|tệ|xấu)|điểm\s+(?:yếu|thấp|kém)/.test(msgLower)) {
    return { threshold: 5.0, comparison: 'lt', qualitative: 'low' };
  }
  if (/gpa\s+(?:giỏi|cao|tốt|xuất sắc)|điểm\s+(?:cao|giỏi|tốt)/.test(msgLower)) {
    return { threshold: 8.0, comparison: 'gte', qualitative: 'high' };
  }

  return { threshold: null, comparison: null };
}

/**
 * Extract attendance reference from a message.
 * @param {string} message
 * @returns {{ threshold: number|null, comparison: string|null }}
 */
function extractAttendanceRef(message) {
  if (!message) return { threshold: null, comparison: null };
  const msgLower = message.toLowerCase();

  const numMatch = msgLower.match(/(?:chuyên cần|attendance|cc|đi học|vắng)\s*(?:<|dưới|thấp hơn|nhỏ hơn|<=)\s*(\d+(?:\.\d+)?)\s*%?/);
  if (numMatch) {
    return { threshold: parseFloat(numMatch[1]), comparison: 'lt' };
  }

  if (/(?:vắng nhiều|nghỉ nhiều|ít đi học|trốn học|hay nghỉ)/.test(msgLower)) {
    return { threshold: 70, comparison: 'lt', qualitative: 'low' };
  }

  if (/(?:cấm thi|sắp cấm thi|nguy cơ cấm thi)/.test(msgLower)) {
    return { threshold: 60, comparison: 'lt', qualitative: 'danger' };
  }

  return { threshold: null, comparison: null };
}

/**
 * Extract timeline/week references from a message.
 * @param {string} message
 * @returns {{ week: number|null, semester: number|null, period: string|null }}
 */
function extractTimeline(message) {
  if (!message) return { week: null, semester: null, period: null };
  const msgLower = message.toLowerCase();

  const weekMatch = msgLower.match(/tuần\s*(\d{1,2})/);
  const week = weekMatch ? parseInt(weekMatch[1]) : null;

  const semMatch = msgLower.match(/(?:học kỳ|hk|semester)\s*(\d)/);
  const semester = semMatch ? parseInt(semMatch[1]) : null;

  let period = null;
  if (/(?:cuối kỳ|thi cuối|final)/.test(msgLower)) period = 'end_of_semester';
  else if (/(?:giữa kỳ|midterm)/.test(msgLower)) period = 'midterm';
  else if (/(?:đầu kỳ|bắt đầu|start)/.test(msgLower)) period = 'start_of_semester';
  else if (/(?:hiện tại|bây giờ|now|hiện)/.test(msgLower)) period = 'current';

  return { week, semester, period };
}

/**
 * Detect follow-up intent keywords in a message.
 * @param {string} message
 * @returns {string|null} Follow-up type or null
 */
function detectFollowupType(message) {
  if (!message) return null;
  const msgLower = message.toLowerCase();

  const followupMap = {
    ROOT_CAUSE: ['nguyên nhân', 'vì sao', 'tại sao', 'rủi ro', 'hổng', 'mất gốc', 'lý do', 'giải thích risk', 'tại sao đỏ', 'xai'],
    ATTENDANCE: ['chuyên cần', 'vắng', 'nghỉ', 'đi học', 'điểm danh', 'cấm thi', 'attendance', 'cc của'],
    INTERVENTION: ['can thiệp', 'giải pháp', 'khắc phục', 'hỗ trợ', 'cứu', 'phụ đạo', 'roadmap', 'kế hoạch học'],
    TIMELINE: ['timeline', 'lộ trình', 'nếu rớt', 'nếu trượt', 'nếu tạch', 'ảnh hưởng', 'chuỗi'],
    STRENGTH: ['điểm mạnh', 'thế mạnh', 'môn nào giỏi', 'học tốt', 'điểm sáng'],
    GPA_DETAIL: ['gpa chi tiết', 'điểm tích lũy', 'tích lũy', 'xếp loại']
  };

  for (const [type, keywords] of Object.entries(followupMap)) {
    if (keywords.some(kw => msgLower.includes(kw))) {
      return type;
    }
  }
  return null;
}

/**
 * Extract Top N from a message.
 * Examples: "top 5 sv", "10 đứa", "top 10"
 * @param {string} message
 * @returns {number|null}
 */
function extractTopN(message) {
  if (!message) return null;
  const msgLower = message.toLowerCase();

  // top N or N sv/đứa
  const topMatch = msgLower.match(/(?:top\s*|)(\d+)\s*(?:sv|đứa|sinh viên|người)/);
  if (topMatch) {
    return parseInt(topMatch[1]);
  }

  // just top N
  const topOnlyMatch = msgLower.match(/top\s*(\d+)/);
  if (topOnlyMatch) {
    return parseInt(topOnlyMatch[1]);
  }

  return null;
}

/**
 * Detect list position references (đầu tiên, thứ hai, cuối cùng, etc.)
 * @param {string} message
 * @returns {number|null} 0-based index or null
 */
function detectListPosition(message) {
  if (!message) return null;
  const msgLower = message.toLowerCase();

  if (/(?:đầu tiên|thứ nhất|đứa đầu|thằng đầu|bạn đầu|số 1|thứ 1|người đầu|sv đầu|em đầu|đứa 1|sv 1)/.test(msgLower)) return 0;
  if (/(?:thứ hai|thứ 2|số 2|bạn thứ hai|đứa thứ hai|em thứ hai|sv thứ hai|đứa 2|sv 2)/.test(msgLower)) return 1;
  if (/(?:thứ ba|thứ 3|số 3|bạn thứ ba|đứa thứ ba|em thứ ba|sv thứ ba|đứa 3|sv 3)/.test(msgLower)) return 2;
  if (/(?:thứ tư|thứ 4|số 4|đứa 4|sv 4)/.test(msgLower)) return 3;
  if (/(?:thứ năm|thứ 5|số 5|đứa 5|sv 5)/.test(msgLower)) return 4;
  if (/(?:cuối cùng|cuối|sv cuối|em cuối|đứa cuối)/.test(msgLower)) return -1; // -1 = last

  return null;
}

/**
 * Extract ALL entities from a message at once.
 * @param {string} message
 * @returns {{ mssv, courseId, allCourseIds, gpaRef, attendanceRef, timeline, followupType, topN, listPosition }}
 */
function extractAllEntities(message) {
  return {
    mssv: extractMssv(message),
    courseId: extractCourseId(message),
    allCourseIds: extractAllCourseIds(message),
    gpaRef: extractGpaRef(message),
    attendanceRef: extractAttendanceRef(message),
    timeline: extractTimeline(message),
    followupType: detectFollowupType(message),
    topN: extractTopN(message),
    listPosition: detectListPosition(message),
    careerGoal: extractCareerGoal(message)
  };
}

module.exports = {
  extractMssv,
  extractCourseId,
  extractAllCourseIds,
  extractGpaRef,
  extractAttendanceRef,
  extractTimeline,
  detectFollowupType,
  extractTopN,
  detectListPosition,
  extractCareerGoal,
  extractAllEntities,
  SUBJECT_ALIASES
};
