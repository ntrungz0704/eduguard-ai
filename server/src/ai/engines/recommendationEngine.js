const { calculateBaseRisk } = require('./riskEngine');

/**
 * Recommendation Engine (Prescriptive Analytics)
 * Phân cấp ưu tiên Hành động (HIGH, MEDIUM, LOW)
 */
function generateRecommendations(student) {
  const risk = calculateBaseRisk(student);
  
  const recommendations = {
    HIGH: [],
    MEDIUM: [],
    LOW: []
  };

  if (risk.level === 'LOW') {
    recommendations.LOW.push("Tiếp tục duy trì phong độ học tập hiện tại.");
    return recommendations;
  }

  // 1. Attendance actions
  if (risk.factors.ATTENDANCE_DROP > 0) {
    if (risk.avgAttendance < 60) {
      recommendations.HIGH.push("Liên hệ Cố vấn học tập ngay lập tức để làm đơn xin cứu xét chuyên cần.");
    } else {
      recommendations.MEDIUM.push("Đi học đầy đủ 100% các buổi còn lại để không bị cấm thi.");
    }
  }

  // 2. Failed subject actions
  if (risk.factors.FAILED_SUBJECTS > 0) {
    recommendations.HIGH.push(`Đăng ký học lại khẩn cấp môn tiên quyết bị nợ (${risk.failedCourses.slice(0, 1).map(c => c.courseId).join(', ')}).`);
    if (risk.failedCourses.length > 1) {
      recommendations.MEDIUM.push(`Tham gia phụ đạo bắt buộc môn ${risk.failedCourses[1].courseId}.`);
    }
  }

  // 3. Lab actions
  if (risk.factors.LOW_LAB_SCORE > 0) {
    recommendations.LOW.push("Tăng cường làm bài tập nhóm, nhờ giảng viên review code/bài làm hàng tuần.");
  }

  // 4. Critical Parent Action
  if (risk.level === 'CRITICAL') {
    recommendations.HIGH.unshift("Gọi điện khẩn cấp cho phụ huynh để phối hợp hỗ trợ sinh viên.");
  }

  return recommendations;
}

module.exports = {
  generateRecommendations
};
