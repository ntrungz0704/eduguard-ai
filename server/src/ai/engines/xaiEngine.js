const { calculateBaseRisk } = require('./riskEngine');

/**
 * XAI Engine (Explainable AI)
 * Translates numeric factors into human-readable reasons.
 */
function explainRisk(student) {
  const baseRisk = calculateBaseRisk(student);
  const reasons = [];

  if (baseRisk.factors.FAILED_SUBJECTS > 0) {
    reasons.push({
      factor: 'Nợ môn / Điểm yếu',
      impact: baseRisk.factors.FAILED_SUBJECTS,
      detail: `${baseRisk.failedCourses.length} môn dưới 5.0 (${baseRisk.failedCourses.slice(0, 2).map(c => c.courseId).join(', ')}...)`
    });
  }

  if (baseRisk.factors.ATTENDANCE_DROP > 0) {
    reasons.push({
      factor: 'Chuyên cần',
      impact: baseRisk.factors.ATTENDANCE_DROP,
      detail: `Chuyên cần trung bình: ${Math.round(baseRisk.avgAttendance)}%`
    });
  }

  if (baseRisk.factors.LOW_LAB_SCORE > 0) {
    reasons.push({
      factor: 'Điểm Lab/Thực hành thấp',
      impact: baseRisk.factors.LOW_LAB_SCORE,
      detail: `Kết quả thực hành không đạt chuẩn an toàn.`
    });
  }

  if (baseRisk.factors.PREREQUISITE_BREAK > 0) {
    reasons.push({
      factor: 'Đứt gãy Tiên quyết',
      impact: baseRisk.factors.PREREQUISITE_BREAK,
      detail: `Hổng kiến thức nền tảng ở các môn cơ sở.`
    });
  }

  if (baseRisk.factors.TREND_DECLINE > 0) {
    reasons.push({
      factor: 'Xu hướng giảm sút',
      impact: baseRisk.factors.TREND_DECLINE,
      detail: `GPA có dấu hiệu đi xuống so với nửa đầu kỳ.`
    });
  }

  reasons.sort((a, b) => b.impact - a.impact);

  return {
    ...baseRisk,
    explanations: reasons
  };
}

module.exports = {
  explainRisk
};
