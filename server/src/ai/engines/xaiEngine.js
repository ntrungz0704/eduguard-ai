const { calculateBaseRisk } = require('./riskEngine');

/**
 * XAI Engine (Explainable AI)
 * Translates numeric factors into human-readable reasons.
 */
function explainRisk(student) {
  const baseRisk = calculateBaseRisk(student);
  const reasons = [];

  if (baseRisk.factors.LOW_GPA > 0) {
    reasons.push({
      factor: 'GPA thấp',
      impact: baseRisk.factors.LOW_GPA,
      detail: `GPA hiện tại: ${baseRisk.gpa.toFixed(2)}`
    });
  }

  if (baseRisk.factors.ATTENDANCE_DROP > 0 && baseRisk.avgAttendance !== null) {
    const ccVal = baseRisk.avgAttendance <= 1.0 ? baseRisk.avgAttendance * 100 : baseRisk.avgAttendance;
    reasons.push({
      factor: 'Chuyên cần',
      impact: baseRisk.factors.ATTENDANCE_DROP,
      detail: `Chuyên cần trung bình: ${Math.round(ccVal)}%`
    });
  }

  if (baseRisk.factors.BEHAVIOR_ANOMALY > 0) {
    reasons.push({
      factor: 'Bất thường hành vi',
      impact: baseRisk.factors.BEHAVIOR_ANOMALY,
      detail: `Kết quả thi cử bất thường hoặc rớt nhiều môn.`
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

  if (baseRisk.factors.LEARNING_STYLE_MISMATCH > 0) {
    const styleMap = {
      'Hands-on': 'Thực hành / Trực quan',
      'Analytical': 'Tư duy logic / Phân tích',
      'Social': 'Học nhóm / Tương tác',
      'Self-taught': 'Tự học / Khám phá',
      'Rote learning': 'Học vẹt / Thuộc lòng',
      'Theory-only': 'Chỉ lý thuyết'
    };
    const styleVN = styleMap[student.learningStyle] || student.learningStyle || 'chưa xác định';
    reasons.push({
      factor: 'Lệch pha Phong cách học & Ngành',
      impact: baseRisk.factors.LEARNING_STYLE_MISMATCH,
      detail: `Phong cách học "${styleVN}" chưa tương thích tốt với đặc thù ngành "${student.careerGoal}".`
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
