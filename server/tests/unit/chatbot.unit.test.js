/**
 * Unit Tests: Chatbot NLP Pipeline Modules
 * Tests: intentRouter, entityExtractor, roleValidator, sessionMemory
 */

const { routeIntent } = require('../../src/modules/chatbot/intentRouter');
const {
  extractMssv,
  extractCourseId,
  extractAllEntities,
  extractGpaRef,
  extractAttendanceRef,
  extractTimeline
} = require('../../src/modules/chatbot/entityExtractor');
const { validateRole } = require('../../src/modules/chatbot/roleValidator');
const { getSession } = require('../../src/modules/chatbot/sessionMemory');

// ============================================================
// intentRouter Tests
// ============================================================
describe('intentRouter', () => {
  test('routes greeting "hello" correctly', () => {
    expect(routeIntent('hello')).toBe('GREETING_INTENT');
  });

  test('routes greeting "xin chào" correctly', () => {
    expect(routeIntent('xin chào')).toBe('GREETING_INTENT');
  });

  test('routes "tình hình lớp" to CLASS_ANALYTICS_INTENT', () => {
    expect(routeIntent('tình hình lớp')).toBe('CLASS_ANALYTICS_INTENT');
  });

  test('routes "sinh viên nguy cơ cao" to CLASS_ANALYTICS_INTENT', () => {
    expect(routeIntent('sinh viên nguy cơ cao')).toBe('CLASS_ANALYTICS_INTENT');
  });

  test('routes "ai cần can thiệp" to CLASS_ANALYTICS_INTENT', () => {
    expect(routeIntent('ai cần can thiệp')).toBe('CLASS_ANALYTICS_INTENT');
  });

  test('routes MSSV message to STUDENT_ANALYTICS_INTENT', () => {
    expect(routeIntent('PS47261')).toBe('STUDENT_ANALYTICS_INTENT');
  });

  test('routes "show risk of PS47261" to STUDENT_ANALYTICS_INTENT', () => {
    expect(routeIntent('show risk of PS47261')).toBe('STUDENT_ANALYTICS_INTENT');
  });

  test('routes "nguyên nhân" to FOLLOWUP_ROOT_CAUSE_INTENT', () => {
    expect(routeIntent('nguyên nhân')).toBe('FOLLOWUP_ROOT_CAUSE_INTENT');
  });

  test('routes "vì sao" to FOLLOWUP_ROOT_CAUSE_INTENT', () => {
    expect(routeIntent('vì sao rủi ro')).toBe('FOLLOWUP_ROOT_CAUSE_INTENT');
  });

  test('routes "chuyên cần" to FOLLOWUP_ATTENDANCE_INTENT', () => {
    expect(routeIntent('chuyên cần của sinh viên này')).toBe('FOLLOWUP_ATTENDANCE_INTENT');
  });

  test('routes "can thiệp" to FOLLOWUP_INTERVENTION_INTENT', () => {
    expect(routeIntent('can thiệp như thế nào')).toBe('FOLLOWUP_INTERVENTION_INTENT');
  });

  test('routes "timeline" to FOLLOWUP_TIMELINE_INTENT', () => {
    expect(routeIntent('timeline học tập')).toBe('FOLLOWUP_TIMELINE_INTENT');
  });

  test('routes "pearson" to GENERAL_SYSTEM_INTENT', () => {
    expect(routeIntent('thuật toán pearson hoạt động thế nào')).toBe('GENERAL_SYSTEM_INTENT');
  });

  test('uses NLP intent for CLASS_ANALYTICS', () => {
    expect(routeIntent('some message', 'CLASS_ANALYTICS')).toBe('CLASS_ANALYTICS_INTENT');
  });

  test('falls back to FALLBACK_INTENT for unknown message', () => {
    expect(routeIntent('ăn trưa hôm nay ăn gì nhỉ')).toBe('FALLBACK_INTENT');
  });
});

// ============================================================
// entityExtractor Tests
// ============================================================
describe('entityExtractor', () => {
  describe('extractMssv', () => {
    test('extracts PS47261 from message', () => {
      expect(extractMssv('phân tích PS47261')).toBe('PS47261');
    });

    test('extracts PC12345 from message', () => {
      expect(extractMssv('show risk of PC12345')).toBe('PC12345');
    });

    test('converts 5-digit number to PS prefix', () => {
      expect(extractMssv('47261')).toBe('PS47261');
    });

    test('returns null for non-MSSV text', () => {
      expect(extractMssv('tình hình lớp')).toBeNull();
    });

    test('is case-insensitive for ps prefix', () => {
      expect(extractMssv('ps47261')).toBe('PS47261');
    });
  });

  describe('extractCourseId', () => {
    test('extracts COM108 from message', () => {
      expect(extractCourseId('môn COM108 bị hổng')).toBe('COM108');
    });

    test('extracts WEB105', () => {
      expect(extractCourseId('điểm WEB105 thấp')).toBe('WEB105');
    });

    test('returns null for no course code', () => {
      expect(extractCourseId('tình hình lớp')).toBeNull();
    });
  });

  describe('extractGpaRef', () => {
    test('extracts threshold from "gpa < 5"', () => {
      const result = extractGpaRef('gpa < 5');
      expect(result.threshold).toBe(5);
      expect(result.comparison).toBe('lt');
    });

    test('extracts qualitative "gpa yếu"', () => {
      const result = extractGpaRef('sinh viên có gpa yếu');
      expect(result.threshold).toBe(5.0);
    });
  });

  describe('extractAttendanceRef', () => {
    test('extracts threshold from "chuyên cần dưới 60%"', () => {
      const result = extractAttendanceRef('chuyên cần dưới 60%');
      expect(result.threshold).toBe(60);
      expect(result.comparison).toBe('lt');
    });

    test('detects qualitative "vắng nhiều"', () => {
      const result = extractAttendanceRef('sinh viên này vắng nhiều');
      expect(result.threshold).toBe(70);
    });
  });

  describe('extractTimeline', () => {
    test('extracts week number', () => {
      const result = extractTimeline('tuần 8 có gì xảy ra');
      expect(result.week).toBe(8);
    });

    test('detects "cuối kỳ" period', () => {
      const result = extractTimeline('cuối kỳ này như thế nào');
      expect(result.period).toBe('end_of_semester');
    });
  });

  describe('extractAllEntities', () => {
    test('extracts multiple entities from complex message', () => {
      const result = extractAllEntities('phân tích PS47261 tuần 8 chuyên cần');
      expect(result.mssv).toBe('PS47261');
      expect(result.timeline.week).toBe(8);
      expect(result.followupType).toBe('ATTENDANCE');
    });
  });
});

// ============================================================
// roleValidator Tests
// ============================================================
describe('roleValidator', () => {
  test('allows TEACHER to view CLASS_ANALYTICS_INTENT', () => {
    const result = validateRole('TEACHER', null, 'USER001', 'CLASS_ANALYTICS_INTENT');
    expect(result.allowed).toBe(true);
  });

  test('blocks STUDENT from CLASS_ANALYTICS_INTENT', () => {
    const result = validateRole('STUDENT', null, 'PS47261', 'CLASS_ANALYTICS_INTENT');
    expect(result.allowed).toBe(false);
    expect(result.reason).toContain('BẢO MẬT');
  });

  test('allows STUDENT to view their own profile', () => {
    const result = validateRole('STUDENT', 'PS47261', 'PS47261', 'STUDENT_ANALYTICS_INTENT');
    expect(result.allowed).toBe(true);
  });

  test('blocks STUDENT from viewing another student profile', () => {
    const result = validateRole('STUDENT', 'PS99999', 'PS47261', 'STUDENT_ANALYTICS_INTENT');
    expect(result.allowed).toBe(false);
  });

  test('allows ADVISOR to view any student', () => {
    const result = validateRole('ADVISOR', 'PS99999', 'USER001', 'STUDENT_ANALYTICS_INTENT');
    expect(result.allowed).toBe(true);
  });
});

// ============================================================
// sessionMemory Tests
// ============================================================
describe('sessionMemory', () => {
  test('creates new session with correct defaults', () => {
    const session = getSession('test-session-001', 'TEACHER');
    expect(session.activeStudent).toBeNull();
    expect(session.role).toBe('TEACHER');
    expect(session.lastIntent).toBe('None');
  });

  test('persists activeStudent across calls', () => {
    const session = getSession('test-session-002', 'TEACHER');
    session.activeStudent = 'PS47261';
    const session2 = getSession('test-session-002', 'TEACHER');
    expect(session2.activeStudent).toBe('PS47261');
  });

  test('different session IDs are isolated', () => {
    const s1 = getSession('test-session-003', 'TEACHER');
    s1.activeStudent = 'PS11111';
    const s2 = getSession('test-session-004', 'TEACHER');
    expect(s2.activeStudent).toBeNull();
  });

  test('updates role on subsequent calls', () => {
    const session = getSession('test-session-005', 'TEACHER');
    const session2 = getSession('test-session-005', 'ADVISOR');
    expect(session2.role).toBe('ADVISOR');
  });
});
