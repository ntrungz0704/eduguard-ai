const { calculateBaseRisk, getRiskLevel } = require('./riskEngine');

/**
 * Scenario Engine (What-if Analysis)
 * 4 Modes: Attendance, Score, Fail Subject, Recovery
 */
function simulateScenario(student, mode, value, additionalValue = null) {
  const currentRisk = calculateBaseRisk(student);
  let simulatedScore = currentRisk.riskScore;
  let details = [];

  switch (mode) {
    case 'ATTENDANCE':
      if (value >= 80) {
        simulatedScore -= currentRisk.factors.ATTENDANCE_DROP;
        details.push(`Chuyên cần đạt ${value}% giúp gỡ bỏ cảnh báo cấm thi (Giảm ${currentRisk.factors.ATTENDANCE_DROP} điểm rủi ro).`);
      }
      break;

    case 'SCORE':
      if (value >= 5.0) {
        simulatedScore -= Math.min(35, currentRisk.factors.FAILED_SUBJECTS);
        details.push(`Kéo điểm thi lên ${value} giúp thoát khỏi nhóm nợ môn nguy hiểm.`);
      }
      break;

    case 'FAIL_SUBJECT':
      simulatedScore += 30;
      details.push(`CẢNH BÁO: Nếu rớt ${value}, chuỗi tiên quyết sẽ bị đứt gãy. Tiến độ tốt nghiệp có thể trễ 1 học kỳ.`);
      break;

    case 'RECOVERY_SCENARIO':
      // Kết hợp cả Attendance và Score
      const targetAttendance = value;
      const targetScore = additionalValue;
      if (targetAttendance >= 85) {
        simulatedScore -= currentRisk.factors.ATTENDANCE_DROP;
        details.push(`Đi học đầy đủ trở lại (${targetAttendance}%) khôi phục điểm chuyên cần.`);
      }
      if (targetScore >= 5.0) {
        simulatedScore -= Math.min(35, currentRisk.factors.FAILED_SUBJECTS);
        details.push(`Vượt qua bài thi với điểm số ${targetScore} gỡ bỏ cảnh báo học vụ.`);
      }
      details.push("🔥 ĐÂY LÀ KỊCH BẢN PHỤC HỒI TỐT NHẤT (RECOVERY PATH).");
      break;
  }

  simulatedScore = Math.max(0, Math.min(100, simulatedScore));

  return {
    originalScore: currentRisk.riskScore,
    originalLevel: currentRisk.level,
    simulatedScore: simulatedScore,
    simulatedLevel: getRiskLevel(simulatedScore).label,
    details
  };
}

module.exports = {
  simulateScenario
};
