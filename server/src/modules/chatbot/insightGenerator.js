// ============================================================
// EduGuard AI — Insight Generator
// Translates raw analytics into Enterprise AI actionable insights
// ============================================================

/**
 * Generate insight for Class Analytics / Risk Ranking
 */
function generateClassInsight(analytics) {
  if (!analytics || !analytics.topAtRisk || analytics.topAtRisk.length === 0) {
    return '✅ Tình hình lớp học đang duy trì mức ổn định. Cố gắng phát huy điểm sáng của nhóm sinh viên giỏi.';
  }

  const { criticals, highs, bottleneckSubjects, total } = analytics;
  let insight = '';

  if (criticals > 0) {
    insight += `- 🚨 **Báo động:** Phát hiện ${criticals} sinh viên ở mức độ CRITICAL. Cần khẩn trương liên hệ phụ huynh và sắp xếp lịch gặp trực tiếp tuần này.\n`;
  } else if (highs > 0) {
    insight += `- ⚠️ **Lưu ý:** Có ${highs} sinh viên đang ở mức HIGH Risk. Cần theo dõi sát chuyên cần và kết quả bài tập.\n`;
  }

  if (bottleneckSubjects && bottleneckSubjects.length > 0) {
    const topBottleneck = bottleneckSubjects[0];
    const failRate = total ? Math.round((topBottleneck.failCount / total) * 100) : 0;
    
    insight += `- 🔥 **Môn học thắt cổ chai:** **${topBottleneck.courseId}** đang có tỷ lệ rớt lên tới ${failRate}%. Môn này đóng vai trò tiên quyết cho nhiều học phần sau. Đề xuất mở lớp phụ đạo ngay hoặc trao đổi với bộ môn để bổ trợ kiến thức.`;
  }

  return insight || '💡 Tiếp tục theo dõi lộ trình học tập của nhóm nguy cơ để có biện pháp can thiệp sớm.';
}

/**
 * Generate insight for a specific student's risk profile
 */
function generateStudentInsight(riskData) {
  if (riskData.level === 'LOW') {
    return '✅ Sinh viên đang duy trì phong độ tốt. Khuyến khích tham gia các hoạt động nghiên cứu hoặc làm dự án thực tế để tăng cường kỹ năng.';
  }

  const reasons = riskData.reasons.map(r => r.factor);
  let insight = `⚠ **Đánh giá XAI:** Sinh viên này đang chịu ảnh hưởng tiêu cực từ các yếu tố: **${reasons.join(', ')}**.\n`;
  
  if (reasons.includes('Nợ môn nền tảng')) {
    insight += `- Việc mất gốc các môn nền tảng sẽ gây đứt gãy chuỗi học vấn, ảnh hưởng tới 4-5 môn tiếp theo.\n`;
  }
  if (reasons.includes('Chuyên cần thấp')) {
    insight += `- Sinh viên đang ở mức báo động về chuyên cần, nguy cơ cấm thi là rất cao.\n`;
  }

  return insight + '💡 **Hành động đề xuất:** Cần triệu tập sinh viên ngay lập tức để làm cam kết cải thiện thành tích học tập.';
}

module.exports = {
  generateClassInsight,
  generateStudentInsight
};
