const { calculateFptGPA } = require('../../legacy/services/dataService');
const appLogger = require('../infrastructure/logger');

// ============================================================
// EduGuard AI — DSS Risk Engine v2.0 (Weighted Predictive Intelligence)
// ============================================================

/**
 * Risk Weight Configuration
 * Total: 100% distributed across 5 factors
 */
const RISK_WEIGHTS = {
  FAILED_SUBJECTS: 0.40,      // 40% — Most critical: failing courses
  ATTENDANCE_DROP: 0.25,      // 25% — Attendance is early warning signal
  LOW_LAB_SCORE: 0.15,        // 15% — Lab/practical performance
  PREREQUISITE_BREAK: 0.10,   // 10% — Knowledge chain breaks
  TREND_DECLINE: 0.10,        // 10% — GPA trend direction
};

/**
 * Risk Level Thresholds (0–100 scale)
 */
const RISK_LEVELS = {
  LOW: { min: 0, max: 25, label: 'LOW', emoji: '🟢' },
  MEDIUM: { min: 26, max: 50, label: 'MEDIUM', emoji: '🟡' },
  HIGH: { min: 51, max: 75, label: 'HIGH', emoji: '🟠' },
  CRITICAL: { min: 76, max: 100, label: 'CRITICAL', emoji: '🔴' },
};

/**
 * Determine risk level from numeric score
 */
function getRiskLevel(score) {
  if (score >= 76) return RISK_LEVELS.CRITICAL;
  if (score >= 51) return RISK_LEVELS.HIGH;
  if (score >= 26) return RISK_LEVELS.MEDIUM;
  return RISK_LEVELS.LOW;
}

/**
 * Calculate Explainable Weighted Risk Score for a student.
 *
 * Returns:
 * {
 *   riskScore: 82,
 *   level: "CRITICAL",
 *   emoji: "🔴",
 *   reasons: [
 *     { factor: "Attendance", weight: "25%", impact: 20, detail: "CC avg 68%" },
 *     { factor: "Failed Subjects", weight: "40%", impact: 35, detail: "2 môn nợ" }
 *   ],
 *   gpa: 5.2,
 *   avgAttendance: 68,
 *   failedCourses: [...],
 *   labCourses: [...]
 * }
 */
function calculateExplainableRisk(student) {
  const reasons = [];
  let totalScore = 0;

  if (!student || !student.scores || student.scores.length === 0) {
    return {
      riskScore: 0,
      level: 'LOW',
      emoji: '🟢',
      reasons: [{ factor: 'Data', weight: '0%', impact: 0, detail: 'Chưa đủ dữ liệu đánh giá' }],
      gpa: 0,
      avgAttendance: 100,
      failedCourses: [],
      labCourses: []
    };
  }

  // ─────────────────────────────────────────────────────────────
  // FACTOR 1: FAILED_SUBJECTS (Weight: 40%)
  // ─────────────────────────────────────────────────────────────
  const failedCourses = student.scores.filter(
    s => s.status === 'FAILED' || (s.value !== null && s.value < 5.0)
  );
  const failedCount = failedCourses.length;

  let failedScore = 0;
  if (failedCount >= 3) {
    failedScore = 100; // Max severity
  } else if (failedCount === 2) {
    failedScore = 75;
  } else if (failedCount === 1) {
    failedScore = 45;
  }

  const failedImpact = Math.round(failedScore * RISK_WEIGHTS.FAILED_SUBJECTS);

  if (failedImpact > 0) {
    const courseNames = failedCourses.slice(0, 2).map(c => c.courseId).join(', ');
    reasons.push({
      factor: 'Nợ môn / Điểm yếu',
      weight: '40%',
      impact: failedImpact,
      detail: `${failedCount} môn dưới 5.0 (${courseNames}${failedCount > 2 ? ',...' : ''})`
    });
    totalScore += failedImpact;
  }

  // ─────────────────────────────────────────────────────────────
  // FACTOR 2: ATTENDANCE_DROP (Weight: 25%)
  // ─────────────────────────────────────────────────────────────
  const studyingCourses = student.scores.filter(
    s => s.status === 'STUDYING' || s.status === 'FAILED'
  );
  const avgAttendance = studyingCourses.length > 0
    ? studyingCourses.reduce((sum, s) => sum + (s.attendance || 100), 0) / studyingCourses.length
    : 100;

  let attendanceScore = 0;
  let attendanceDetail = '';
  if (avgAttendance < 60) {
    attendanceScore = 100;
    attendanceDetail = `⚠️ Chuyên cần nghiêm trọng (${Math.round(avgAttendance)}%) — Nguy cơ cấm thi`;
  } else if (avgAttendance < 70) {
    attendanceScore = 80;
    attendanceDetail = `Chuyên cần rất thấp (${Math.round(avgAttendance)}%) — Cần can thiệp ngay`;
  } else if (avgAttendance < 80) {
    attendanceScore = 55;
    attendanceDetail = `Chuyên cần giảm sút (${Math.round(avgAttendance)}%) — Cần theo dõi`;
  } else if (avgAttendance < 90) {
    attendanceScore = 20;
    attendanceDetail = `Chuyên cần khá (${Math.round(avgAttendance)}%) — Chú ý duy trì`;
  }

  const attendanceImpact = Math.round(attendanceScore * RISK_WEIGHTS.ATTENDANCE_DROP);
  if (attendanceImpact > 0) {
    reasons.push({
      factor: 'Chuyên cần (Attendance)',
      weight: '25%',
      impact: attendanceImpact,
      detail: attendanceDetail
    });
    totalScore += attendanceImpact;
  }

  // ─────────────────────────────────────────────────────────────
  // FACTOR 3: LOW_LAB_SCORE (Weight: 15%)
  // ─────────────────────────────────────────────────────────────
  // Lab/practical courses typically contain keywords: LAB, PRJ, PRO, WEB, MOB
  const labKeywords = ['LAB', 'PRJ', 'PRO', 'WEB', 'MOB', 'NET'];
  const labCourses = student.scores.filter(s => {
    const id = (s.courseId || '').toUpperCase();
    return labKeywords.some(kw => id.includes(kw));
  });

  let labScore = 0;
  let labDetail = '';
  if (labCourses.length > 0) {
    const lowLabCount = labCourses.filter(s => s.value !== null && s.value < 5.0).length;
    const avgLabScore = labCourses
      .filter(s => s.value !== null)
      .reduce((sum, s) => sum + s.value, 0) / Math.max(1, labCourses.filter(s => s.value !== null).length);

    if (lowLabCount > 0) {
      labScore = 80;
      labDetail = `${lowLabCount}/${labCourses.length} môn thực hành dưới 5.0`;
    } else if (avgLabScore < 6.5 && labCourses.length > 0) {
      labScore = 40;
      labDetail = `Điểm thực hành trung bình thấp (${avgLabScore.toFixed(1)}/10)`;
    }
  }

  const labImpact = Math.round(labScore * RISK_WEIGHTS.LOW_LAB_SCORE);
  if (labImpact > 0) {
    reasons.push({
      factor: 'Điểm Lab/Thực hành thấp',
      weight: '15%',
      impact: labImpact,
      detail: labDetail
    });
    totalScore += labImpact;
  }

  // ─────────────────────────────────────────────────────────────
  // FACTOR 4: PREREQUISITE_BREAK (Weight: 10%)
  // ─────────────────────────────────────────────────────────────
  // Simple heuristic: if failed courses are foundational (lower course numbers)
  const prereqFailed = failedCourses.filter(s => {
    const match = (s.courseId || '').match(/\d+/);
    return match && parseInt(match[0]) <= 200; // 100-200 level = foundational
  });

  let prereqScore = 0;
  let prereqDetail = '';
  if (prereqFailed.length > 0) {
    prereqScore = prereqFailed.length >= 2 ? 100 : 60;
    prereqDetail = `Hổng nền tảng: ${prereqFailed.map(c => c.courseId).join(', ')}`;
  }

  const prereqImpact = Math.round(prereqScore * RISK_WEIGHTS.PREREQUISITE_BREAK);
  if (prereqImpact > 0) {
    reasons.push({
      factor: 'Đứt gãy Tiên quyết (Prerequisite Break)',
      weight: '10%',
      impact: prereqImpact,
      detail: prereqDetail
    });
    totalScore += prereqImpact;
  }

  // ─────────────────────────────────────────────────────────────
  // FACTOR 5: TREND_DECLINE (Weight: 10%)
  // ─────────────────────────────────────────────────────────────
  // Detect declining trend: more recent scores are worse than older ones
  const gpa = calculateFptGPA(student.scores);
  const scoredSubjects = student.scores.filter(s => s.value !== null && s.status !== 'STUDYING');

  let trendScore = 0;
  let trendDetail = '';

  if (scoredSubjects.length >= 4) {
    const half = Math.floor(scoredSubjects.length / 2);
    const earlyAvg = scoredSubjects.slice(0, half).reduce((s, c) => s + c.value, 0) / half;
    const lateAvg = scoredSubjects.slice(half).reduce((s, c) => s + c.value, 0) / (scoredSubjects.length - half);
    const decline = earlyAvg - lateAvg;

    if (decline > 1.5) {
      trendScore = 100;
      trendDetail = `GPA giảm mạnh (${earlyAvg.toFixed(1)} → ${lateAvg.toFixed(1)})`;
    } else if (decline > 0.5) {
      trendScore = 50;
      trendDetail = `GPA có xu hướng giảm nhẹ (${earlyAvg.toFixed(1)} → ${lateAvg.toFixed(1)})`;
    }
  } else if (gpa < 5.0 && scoredSubjects.length > 0) {
    trendScore = 60;
    trendDetail = `GPA ở mức báo động (${gpa.toFixed(1)}/10)`;
  }

  const trendImpact = Math.round(trendScore * RISK_WEIGHTS.TREND_DECLINE);
  if (trendImpact > 0) {
    reasons.push({
      factor: 'Xu hướng giảm sút (Trend Decline)',
      weight: '10%',
      impact: trendImpact,
      detail: trendDetail
    });
    totalScore += trendImpact;
  }

  // ─────────────────────────────────────────────────────────────
  // FINAL SCORE
  // ─────────────────────────────────────────────────────────────
  const riskScore = Math.min(100, Math.round(totalScore));
  const riskLevel = getRiskLevel(riskScore);

  // Sort reasons by impact descending
  reasons.sort((a, b) => b.impact - a.impact);

  const result = {
    riskScore,
    level: riskLevel.label,
    emoji: riskLevel.emoji,
    reasons,
    gpa,
    avgAttendance,
    failedCourses,
    labCourses,
    // Legacy compatibility fields
    riskLevel: riskLevel.label,
    explanations: reasons.map(r => ({
      factor: r.factor,
      impact: r.impact,
      text: r.detail
    }))
  };

  appLogger.dss(student.mssv || student.id, riskScore, riskLevel.label, reasons.length);

  return result;
}

// ============================================================
// Academic Timeline Generator
// ============================================================

/**
 * Generate academic monitoring timeline based on student risk profile.
 * Simulates weekly events for a 16-week semester.
 */
function generateAcademicTimeline(student, riskData) {
  const timeline = [];
  const { gpa, avgAttendance, failedCourses, level } = riskData;

  if (level === 'CRITICAL') {
    if (avgAttendance < 80) {
      timeline.push({
        week: 3,
        type: 'WARNING',
        event: `Hệ thống ghi nhận chuyên cần bắt đầu giảm sút (${Math.round(Math.min(100, avgAttendance + 10))}%)`
      });
    }
    if (failedCourses.length > 0) {
      timeline.push({
        week: 5,
        type: 'DANGER',
        event: `Cảnh báo sớm: Dấu hiệu hổng kiến thức môn ${failedCourses[0].courseId} (${failedCourses[0].value?.toFixed(1) || 'N/A'}đ)`
      });
    }
    timeline.push({
      week: 6,
      type: 'DANGER',
      event: `Xu hướng GPA dự báo giảm mạnh — thiếu kỷ luật học tập tích lũy`
    });
    timeline.push({
      week: 8,
      type: 'CRITICAL',
      event: `🚨 Báo động Đỏ: Risk Score leo thang mức CRITICAL (${riskData.riskScore}/100)`
    });
    if (failedCourses.length >= 2) {
      timeline.push({
        week: 10,
        type: 'CRITICAL',
        event: `Nguy cơ đứt gãy dây chuyền: Rớt ${failedCourses.length} môn có thể khoá học phần phụ thuộc`
      });
    }
    timeline.push({
      week: 14,
      type: 'INTERVENTION',
      event: `Khuyến nghị: Cố vấn học tập cần can thiệp trực tiếp trước khi thi cuối kỳ`
    });
  } else if (level === 'HIGH') {
    timeline.push({
      week: 4,
      type: 'WARNING',
      event: `Phong độ học tập có dấu hiệu chững lại — GPA dự báo dưới 6.5`
    });
    if (failedCourses.length > 0) {
      timeline.push({
        week: 6,
        type: 'DANGER',
        event: `Cần theo dõi sát sao: Dấu hiệu yếu môn ${failedCourses[0].courseId}`
      });
    }
    timeline.push({
      week: 8,
      type: 'WARNING',
      event: `Mức độ rủi ro: HIGH — Nên lên kế hoạch can thiệp`
    });
    timeline.push({
      week: 12,
      type: 'INTERVENTION',
      event: `Đề xuất: Bổ sung bài tập thực hành bù đắp điểm yếu`
    });
  } else if (level === 'MEDIUM') {
    timeline.push({
      week: 4,
      type: 'INFO',
      event: `Học lực ổn định nhưng có một số điểm cần cải thiện`
    });
    timeline.push({
      week: 8,
      type: 'INFO',
      event: `Mức độ rủi ro: MEDIUM — Tiếp tục giám sát`
    });
    timeline.push({
      week: 12,
      type: 'INFO',
      event: `GPA hiện tại: ${gpa.toFixed(1)}/10 — Cần nỗ lực duy trì hoặc cải thiện`
    });
  } else {
    // LOW risk
    timeline.push({ week: 3, type: 'SUCCESS', event: `Kết quả đầu kỳ duy trì phong độ tốt` });
    timeline.push({ week: 5, type: 'SUCCESS', event: `Hoàn thành tốt các bài kiểm tra thực hành` });
    timeline.push({ week: 8, type: 'SUCCESS', event: `Học lực ổn định (GPA: ${gpa.toFixed(1)}/10) — Tiếp tục phát huy` });
    timeline.push({ week: 12, type: 'SUCCESS', event: `Không ghi nhận sự kiện cảnh báo — Học tập tốt` });
  }

  return timeline.sort((a, b) => a.week - b.week);
}

// ============================================================
// Class Analytics Engine
// ============================================================

/**
 * Compute class-level analytics summary
 * Returns: { criticals, highs, mediums, lows, topAtRisk, bottleneckSubjects }
 */
function computeClassAnalytics(students) {
  const riskProfiles = students.map(s => {
    const risk = calculateExplainableRisk(s);
    return {
      mssv: s.mssv || s.id,
      name: s.name,
      ...risk
    };
  }).sort((a, b) => b.riskScore - a.riskScore);

  const criticals = riskProfiles.filter(r => r.level === 'CRITICAL');
  const highs = riskProfiles.filter(r => r.level === 'HIGH');
  const mediums = riskProfiles.filter(r => r.level === 'MEDIUM');
  const lows = riskProfiles.filter(r => r.level === 'LOW');

  // Bottleneck subjects: most frequently failed
  const subjectFailCount = {};
  students.forEach(s => {
    (s.scores || []).forEach(sc => {
      if (sc.value !== null && sc.value < 5.0) {
        subjectFailCount[sc.courseId] = (subjectFailCount[sc.courseId] || 0) + 1;
      }
    });
  });

  const bottleneckSubjects = Object.entries(subjectFailCount)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([courseId, failCount]) => ({ courseId, failCount }));

  return {
    total: students.length,
    criticals: criticals.length,
    highs: highs.length,
    mediums: mediums.length,
    lows: lows.length,
    topAtRisk: riskProfiles.slice(0, 5),
    riskProfiles,
    bottleneckSubjects,
    distribution: {
      CRITICAL: criticals.length,
      HIGH: highs.length,
      MEDIUM: mediums.length,
      LOW: lows.length
    }
  };
}

module.exports = {
  calculateExplainableRisk,
  generateAcademicTimeline,
  computeClassAnalytics,
  RISK_WEIGHTS,
  RISK_LEVELS,
  getRiskLevel
};
