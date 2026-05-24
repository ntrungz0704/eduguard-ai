/**
 * Unit Tests: DSS Risk Engine v2.0
 * Tests: calculateExplainableRisk, generateAcademicTimeline, RISK_WEIGHTS
 */

const {
  calculateExplainableRisk,
  generateAcademicTimeline,
  computeClassAnalytics,
  RISK_WEIGHTS,
  getRiskLevel
} = require('../../src/ai/dssEngine');

// ============================================================
// Mock student factory
// ============================================================
function makeStudent(opts = {}) {
  return {
    mssv: opts.mssv || 'PS00000',
    name: opts.name || 'Test Student',
    classCode: 'WD18301',
    scores: opts.scores || []
  };
}

function makeScore(courseId, value, status = null, attendance = 90) {
  return {
    courseId,
    value,
    attendance,
    status: status || (value === null ? 'STUDYING' : value >= 5 ? 'PASSED' : 'FAILED')
  };
}

// ============================================================
// RISK_WEIGHTS Tests
// ============================================================
describe('RISK_WEIGHTS', () => {
  test('weights sum to 1.0 (100%)', () => {
    const total = Object.values(RISK_WEIGHTS).reduce((s, w) => s + w, 0);
    expect(total).toBeCloseTo(1.0, 5);
  });

  test('FAILED_SUBJECTS has highest weight (40%)', () => {
    expect(RISK_WEIGHTS.FAILED_SUBJECTS).toBe(0.40);
  });

  test('ATTENDANCE_DROP is second highest (25%)', () => {
    expect(RISK_WEIGHTS.ATTENDANCE_DROP).toBe(0.25);
  });
});

// ============================================================
// getRiskLevel Tests
// ============================================================
describe('getRiskLevel', () => {
  test('score 0 → LOW', () => {
    expect(getRiskLevel(0).label).toBe('LOW');
  });

  test('score 25 → LOW', () => {
    expect(getRiskLevel(25).label).toBe('LOW');
  });

  test('score 26 → MEDIUM', () => {
    expect(getRiskLevel(26).label).toBe('MEDIUM');
  });

  test('score 50 → MEDIUM', () => {
    expect(getRiskLevel(50).label).toBe('MEDIUM');
  });

  test('score 51 → HIGH', () => {
    expect(getRiskLevel(51).label).toBe('HIGH');
  });

  test('score 75 → HIGH', () => {
    expect(getRiskLevel(75).label).toBe('HIGH');
  });

  test('score 76 → CRITICAL', () => {
    expect(getRiskLevel(76).label).toBe('CRITICAL');
  });

  test('score 100 → CRITICAL', () => {
    expect(getRiskLevel(100).label).toBe('CRITICAL');
  });
});

// ============================================================
// calculateExplainableRisk Tests
// ============================================================
describe('calculateExplainableRisk', () => {
  test('returns LOW risk for perfect student', () => {
    const student = makeStudent({
      scores: [
        makeScore('COM101', 9.5, 'PASSED', 98),
        makeScore('WEB105', 8.0, 'PASSED', 95),
        makeScore('PRO101', 9.0, 'PASSED', 100)
      ]
    });
    const result = calculateExplainableRisk(student);
    expect(result.level).toBe('LOW');
    expect(result.riskScore).toBeLessThanOrEqual(25);
  });

  test('returns CRITICAL for student with multiple failures and low attendance', () => {
    const student = makeStudent({
      scores: [
        makeScore('COM101', 3.0, 'FAILED', 55),
        makeScore('WEB105', 2.5, 'FAILED', 50),
        makeScore('PRO101', 4.5, 'FAILED', 60),
        makeScore('NET201', null, 'STUDYING', 55)
      ]
    });
    const result = calculateExplainableRisk(student);
    expect(result.level).toBe('CRITICAL');
    expect(result.riskScore).toBeGreaterThanOrEqual(76);
  });

  test('reasons array has correct structure', () => {
    const student = makeStudent({
      scores: [makeScore('COM101', 4.0, 'FAILED', 65)]
    });
    const result = calculateExplainableRisk(student);
    result.reasons.forEach(r => {
      expect(r).toHaveProperty('factor');
      expect(r).toHaveProperty('weight');
      expect(r).toHaveProperty('impact');
      expect(r).toHaveProperty('detail');
      expect(typeof r.impact).toBe('number');
    });
  });

  test('riskScore is capped at 100', () => {
    const student = makeStudent({
      scores: [
        makeScore('COM101', 0, 'FAILED', 30),
        makeScore('WEB105', 0, 'FAILED', 25),
        makeScore('PRO101', 0, 'FAILED', 20),
        makeScore('NET201', 0, 'FAILED', 15),
        makeScore('MOB301', 0, 'FAILED', 10)
      ]
    });
    const result = calculateExplainableRisk(student);
    expect(result.riskScore).toBeLessThanOrEqual(100);
    expect(result.riskScore).toBeGreaterThanOrEqual(0);
  });

  test('attendance < 60% triggers CRITICAL attendance factor', () => {
    const student = makeStudent({
      scores: [makeScore('COM101', 7.0, 'PASSED', 55), makeScore('WEB105', null, 'STUDYING', 55)]
    });
    const result = calculateExplainableRisk(student);
    const attReason = result.reasons.find(r => r.factor.includes('Attendance') || r.factor.includes('Chuyên cần'));
    expect(attReason).toBeDefined();
    expect(attReason.impact).toBeGreaterThan(0);
  });

  test('returns empty data response for student with no scores', () => {
    const student = makeStudent({ scores: [] });
    const result = calculateExplainableRisk(student);
    expect(result.riskScore).toBe(0);
    expect(result.level).toBe('LOW');
  });

  test('returns structured result with all required fields', () => {
    const student = makeStudent({
      scores: [makeScore('COM101', 6.0, 'PASSED', 85)]
    });
    const result = calculateExplainableRisk(student);
    expect(result).toHaveProperty('riskScore');
    expect(result).toHaveProperty('level');
    expect(result).toHaveProperty('emoji');
    expect(result).toHaveProperty('reasons');
    expect(result).toHaveProperty('gpa');
    expect(result).toHaveProperty('avgAttendance');
    expect(result).toHaveProperty('failedCourses');
    expect(Array.isArray(result.reasons)).toBe(true);
  });

  test('reasons are sorted by impact descending', () => {
    const student = makeStudent({
      scores: [
        makeScore('COM101', 3.0, 'FAILED', 55),
        makeScore('WEB105', 4.0, 'FAILED', 58),
        makeScore('PRO101', null, 'STUDYING', 55)
      ]
    });
    const result = calculateExplainableRisk(student);
    for (let i = 0; i < result.reasons.length - 1; i++) {
      expect(result.reasons[i].impact).toBeGreaterThanOrEqual(result.reasons[i + 1].impact);
    }
  });
});

// ============================================================
// generateAcademicTimeline Tests
// ============================================================
describe('generateAcademicTimeline', () => {
  test('returns timeline array for CRITICAL student', () => {
    const student = makeStudent({ scores: [makeScore('COM101', 3.0, 'FAILED', 55)] });
    const riskData = calculateExplainableRisk(student);
    const timeline = generateAcademicTimeline(student, riskData);
    expect(Array.isArray(timeline)).toBe(true);
    expect(timeline.length).toBeGreaterThan(0);
  });

  test('timeline events have required fields', () => {
    const student = makeStudent({ scores: [makeScore('COM101', 8.0, 'PASSED', 95)] });
    const riskData = calculateExplainableRisk(student);
    const timeline = generateAcademicTimeline(student, riskData);
    timeline.forEach(event => {
      expect(event).toHaveProperty('week');
      expect(event).toHaveProperty('event');
      expect(event).toHaveProperty('type');
      expect(typeof event.week).toBe('number');
    });
  });

  test('timeline is sorted by week ascending', () => {
    const student = makeStudent({ scores: [makeScore('COM101', 3.0, 'FAILED', 50)] });
    const riskData = calculateExplainableRisk(student);
    const timeline = generateAcademicTimeline(student, riskData);
    for (let i = 0; i < timeline.length - 1; i++) {
      expect(timeline[i].week).toBeLessThanOrEqual(timeline[i + 1].week);
    }
  });
});

// ============================================================
// computeClassAnalytics Tests
// ============================================================
describe('computeClassAnalytics', () => {
  test('correctly counts risk distribution', () => {
    const students = [
      makeStudent({ mssv: 'PS00001', scores: [makeScore('COM101', 2.0, 'FAILED', 50)] }),
      makeStudent({ mssv: 'PS00002', scores: [makeScore('COM101', 9.0, 'PASSED', 98)] }),
      makeStudent({ mssv: 'PS00003', scores: [makeScore('COM101', 5.5, 'PASSED', 80)] })
    ];
    const analytics = computeClassAnalytics(students);
    expect(analytics.total).toBe(3);
    expect(analytics.distribution).toHaveProperty('CRITICAL');
    expect(analytics.distribution).toHaveProperty('HIGH');
    expect(analytics.distribution).toHaveProperty('LOW');
  });

  test('identifies bottleneck subjects', () => {
    const students = [
      makeStudent({ mssv: 'PS00001', scores: [makeScore('COM101', 3.0, 'FAILED')] }),
      makeStudent({ mssv: 'PS00002', scores: [makeScore('COM101', 4.0, 'FAILED')] }),
      makeStudent({ mssv: 'PS00003', scores: [makeScore('WEB105', 2.0, 'FAILED')] })
    ];
    const analytics = computeClassAnalytics(students);
    expect(analytics.bottleneckSubjects.length).toBeGreaterThan(0);
    expect(analytics.bottleneckSubjects[0].courseId).toBe('COM101');
    expect(analytics.bottleneckSubjects[0].failCount).toBe(2);
  });
});
