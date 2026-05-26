// ============================================================
// EduGuard AI — Response Formatter
// Handles all text formatting, badges, confidence scores, 
// and dynamic insights for the Chatbot.
// ============================================================

/**
 * Phân tích điểm Risk Score để đưa ra Mức độ Tự tin (Confidence Calibration)
 * @param {number} riskScore 
 * @returns {string} High/Medium/Low
 */
function formatConfidence(riskScore) {
  if (typeof riskScore !== 'number') return 'Medium (Probability: N/A)';
  
  // Normalize risk score to probability (0.0 to 1.0)
  const prob = riskScore / 100;
  
  let confidence = 'Low';
  if (prob >= 0.85) confidence = 'High';
  else if (prob >= 0.65) confidence = 'Medium';
  
  return `${confidence} (Probability: ${(prob * 100).toFixed(1)}%)`;
}

/**
 * Trả về chuỗi Badge kèm Emoji tương ứng với Risk Level
 */
function formatRiskBadge(level, score = null) {
  let badge = '';
  switch (level) {
    case 'CRITICAL':
      badge = '🔴 CRITICAL';
      break;
    case 'HIGH':
      badge = '🟠 HIGH RISK';
      break;
    case 'MEDIUM':
      badge = '🟡 MEDIUM RISK';
      break;
    case 'LOW':
    default:
      badge = '🟢 LOW RISK';
      break;
  }
  return score !== null ? `${badge} (${score}/100)` : badge;
}

/**
 * Format chuỗi nguyên nhân rớt môn (XAI Explanations)
 */
function formatReasons(reasons) {
  if (!reasons || reasons.length === 0) return '- Không có vấn đề nghiêm trọng nào được phát hiện.';
  return reasons.map(r => {
    if (r.type === 'FAILED_PREREQ') {
      return `- 🚨 **Nợ môn tiên quyết:** ${r.courseId} (Ảnh hưởng: Rất nghiêm trọng)`;
    } else if (r.type === 'LOW_ATTENDANCE') {
      return `- 📉 **Chuyên cần thấp:** Môn ${r.courseId} chỉ đạt ${r.value}% (Nguy cơ cấm thi)`;
    } else if (r.type === 'LOW_SCORE') {
      return `- ⚠️ **Điểm quá trình thấp:** Môn ${r.courseId} đang có nguy cơ không qua môn.`;
    }
    return `- ⚠ **Vấn đề khác:** ${r.courseId}`;
  }).join('\n');
}

/**
 * Format timeline cảnh báo
 */
function formatTimeline(timeline) {
  if (!timeline || timeline.length === 0) return '- Chưa có sự kiện cảnh báo nào.';
  return timeline.map(evt => {
    let emoji = '📌';
    if (evt.level === 'CRITICAL') emoji = '🚨';
    else if (evt.level === 'HIGH') emoji = '⚠️';
    return `${emoji} **${evt.week}**: ${evt.message}`;
  }).join('\n');
}

/**
 * Dynamic Insight Generator: Phân tích Class Analytics
 */
function generateDynamicClassInsight(analytics) {
  if (!analytics || !analytics.total) return 'Chưa đủ dữ liệu để phân tích Insight lớp học.';
  
  const criticalPercent = (analytics.criticals / analytics.total) * 100;
  
  if (criticalPercent > 15) {
    return `Dữ liệu hiện tại cho thấy nhóm sinh viên CRITICAL đang tăng bất thường. Nguyên nhân chính bắt nguồn từ sự đứt gãy kiến thức ở các môn Bottleneck. Việc này sẽ tạo ra rủi ro dây chuyền nếu không can thiệp kịp thời.`;
  } else if (analytics.bottleneckSubjects && analytics.bottleneckSubjects.length > 0) {
    return `Phần lớn Risk Score toàn lớp tập trung ở môn **${analytics.bottleneckSubjects[0].courseId}**. Đây là nút thắt cổ chai lớn nhất học kỳ này, kéo theo sự sụt giảm chuyên cần ở các môn phụ thuộc.`;
  }
  
  return `Lớp học đang duy trì trạng thái khá ổn định. Đa số sinh viên có phong độ tốt và không gặp vấn đề lớn với các môn nền tảng.`;
}

/**
 * Dynamic Insight Generator: Phân tích Sinh viên
 */
function generateDynamicStudentInsight(riskData) {
  if (riskData.level === 'CRITICAL' || riskData.level === 'HIGH') {
    const hasAttendanceIssue = riskData.reasons?.some(r => r.type === 'LOW_ATTENDANCE');
    const hasPrereqIssue = riskData.reasons?.some(r => r.type === 'FAILED_PREREQ');
    
    if (hasAttendanceIssue && hasPrereqIssue) {
      return 'Dữ liệu cho thấy nguyên nhân chính đến từ sự đứt gãy ở môn nền tảng và xu hướng giảm chuyên cần kéo dài. Bạn cần sắp xếp lại thời gian học ngay lập tức để không bị cấm thi.';
    } else if (hasAttendanceIssue) {
      return 'Xu hướng giảm điểm danh (Attendance) đang là rủi ro lớn nhất của bạn lúc này. Hãy đi học đầy đủ trong 2 tuần tới, GPA của bạn sẽ an toàn.';
    } else {
      return 'Dữ liệu hiện tại cho thấy bạn đang gặp khó khăn ở nhóm môn thực hành. Nếu cải thiện điểm Assignment từ bây giờ, kết quả chung sẽ thay đổi đáng kể.';
    }
  }
  return 'Bạn đang giữ phong độ khá tốt. Hãy tiếp tục duy trì chuyên cần và cố gắng lấy điểm cao ở các môn chuyên ngành nhé!';
}

module.exports = {
  formatConfidence,
  formatRiskBadge,
  formatReasons,
  formatTimeline,
  generateDynamicClassInsight,
  generateDynamicStudentInsight
};
