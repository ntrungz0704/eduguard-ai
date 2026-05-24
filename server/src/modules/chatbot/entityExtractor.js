// ============================================================
// EduGuard AI — Entity Extractor
// Extracts structured entities from natural language messages
// ============================================================

/**
 * Extract MSSV (Student ID) from a message.
 * Supports: PS47261, PC12345, PK00001, PD99999, or pure 5-digit numbers.
 * @param {string} message
 * @returns {string|null} Normalized MSSV (uppercase) or null
 */
function extractMssv(message) {
  if (!message) return null;
  const trimmed = message.replace(/\s+/g, '').toUpperCase();
  // Pure numeric 5 digits → prepend PS
  if (/^\d{5}$/.test(trimmed)) {
    return `PS${trimmed}`;
  }
  // Standard pattern PS/PC/PK/PD followed by 5 digits
  const match = trimmed.match(/(PS|PC|PK|PD)\d{5}/i);
  if (match) {
    return match[0].toUpperCase();
  }
  return null;
}

/**
 * Extract a Course/Subject ID from a message.
 * FPT Polytechnic format: 3 uppercase letters + 3 digits (e.g., COM108, WEB105, PRO101)
 * @param {string} message
 * @returns {string|null}
 */
function extractCourseId(message) {
  if (!message) return null;
  const msgUpper = message.toUpperCase();
  const match = msgUpper.match(/\b[A-Z]{2,4}\d{3}\b/);
  if (match) return match[0];
  return null;
}

/**
 * Extract all Course IDs found in the message.
 * @param {string} message
 * @returns {string[]}
 */
function extractAllCourseIds(message) {
  if (!message) return [];
  const msgUpper = message.toUpperCase();
  const matches = msgUpper.match(/\b[A-Z]{2,4}\d{3}\b/g);
  return matches ? [...new Set(matches)] : [];
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
 * Examples: "chuyên cần dưới 60%", "vắng nhiều", "attendance < 70%"
 * @param {string} message
 * @returns {{ threshold: number|null, comparison: string|null }}
 */
function extractAttendanceRef(message) {
  if (!message) return { threshold: null, comparison: null };
  const msgLower = message.toLowerCase();

  // Numeric: "chuyên cần < 70%", "dưới 60%"
  const numMatch = msgLower.match(/(?:chuyên cần|attendance|cc|đi học|vắng)\s*(?:<|dưới|thấp hơn|nhỏ hơn|<=)\s*(\d+(?:\.\d+)?)\s*%?/);
  if (numMatch) {
    return { threshold: parseFloat(numMatch[1]), comparison: 'lt' };
  }

  // Qualitative: "vắng nhiều", "nghỉ nhiều", "ít đi học"
  if (/(?:vắng nhiều|nghỉ nhiều|ít đi học|trốn học|hay nghỉ)/.test(msgLower)) {
    return { threshold: 70, comparison: 'lt', qualitative: 'low' };
  }

  // Danger zone
  if (/(?:cấm thi|sắp cấm thi|nguy cơ cấm thi)/.test(msgLower)) {
    return { threshold: 60, comparison: 'lt', qualitative: 'danger' };
  }

  return { threshold: null, comparison: null };
}

/**
 * Extract timeline/week references from a message.
 * Examples: "tuần 8", "học kỳ 2", "tháng 5", "cuối kỳ"
 * @param {string} message
 * @returns {{ week: number|null, semester: number|null, period: string|null }}
 */
function extractTimeline(message) {
  if (!message) return { week: null, semester: null, period: null };
  const msgLower = message.toLowerCase();

  // Week reference
  const weekMatch = msgLower.match(/tuần\s*(\d{1,2})/);
  const week = weekMatch ? parseInt(weekMatch[1]) : null;

  // Semester reference
  const semMatch = msgLower.match(/(?:học kỳ|hk|semester)\s*(\d)/);
  const semester = semMatch ? parseInt(semMatch[1]) : null;

  // Period keywords
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
    ROOT_CAUSE: ['nguyên nhân', 'vì sao', 'tại sao', 'rủi ro', 'hổng', 'mất gốc', 'lý do'],
    ATTENDANCE: ['chuyên cần', 'vắng', 'nghỉ', 'đi học', 'điểm danh', 'cấm thi'],
    INTERVENTION: ['can thiệp', 'giải pháp', 'khắc phục', 'hỗ trợ', 'cứu', 'phụ đạo'],
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
 * Extract ALL entities from a message at once.
 * @param {string} message
 * @returns {{ mssv, courseId, allCourseIds, gpaRef, attendanceRef, timeline, followupType }}
 */
function extractAllEntities(message) {
  return {
    mssv: extractMssv(message),
    courseId: extractCourseId(message),
    allCourseIds: extractAllCourseIds(message),
    gpaRef: extractGpaRef(message),
    attendanceRef: extractAttendanceRef(message),
    timeline: extractTimeline(message),
    followupType: detectFollowupType(message)
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
  extractAllEntities
};
