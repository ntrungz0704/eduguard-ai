// ============================================================
// EduGuard AI — Recommendation Engine
// Generates weekly actionable roadmaps for student interventions
// ============================================================

/**
 * Generate actionable roadmap for a specific student based on their risk level and factors
 */
function generateInterventionRoadmap(student, riskData) {
  const level = riskData.level;
  if (level === 'LOW') {
    return '🎯 Lộ trình phát triển:\n- Khuyến khích tham gia thi Code/Olympic.\n- Mentoring cho các sinh viên khóa dưới.';
  }

  const reasons = (riskData.explanations || riskData.reasons || []).map(r => r.factor || '');
  let roadmap = '🎯 **Lộ trình can thiệp đề xuất:**\n\n';

  if (level === 'CRITICAL') {
    roadmap += '**Tuần 1: Can thiệp khẩn cấp**\n';
    roadmap += '- Gọi điện thoại cho phụ huynh và sinh viên.\n';
    if (reasons.some(r => r.includes('Nợ môn') || r.includes('Tiên quyết'))) {
      roadmap += '- Hỗ trợ thủ tục bảo lưu hoặc rút bớt môn phụ để tập trung trả nợ môn chính.\n';
    }
    
    roadmap += '\n**Tuần 2: Giám sát sát sao**\n';
    roadmap += '- Yêu cầu cố vấn học tập kiểm tra chuyên cần mỗi thứ Sáu.\n';
    roadmap += '- Bắt buộc sinh viên ký cam kết tham gia lớp phụ đạo.\n';
    
    roadmap += '\n**Tuần 3: Đánh giá lại**\n';
    roadmap += '- Review điểm Quiz/Lab của tuần 1 & 2 để đưa ra quyết định cuối.\n';
  } else if (level === 'HIGH') {
    roadmap += '**Tuần 1: Cảnh báo sớm**\n';
    roadmap += '- Gửi email tự động từ hệ thống cảnh báo nguy cơ.\n';
    roadmap += '- Hẹn lịch gặp mặt Cố vấn học tập (CVHT).\n';
    
    roadmap += '\n**Tuần 2: Kế hoạch bù đắp kiến thức**\n';
    if (reasons.some(r => r.includes('Xu hướng') || r.includes('Lab'))) {
      roadmap += '- Phân tích bài tập đang làm kém để gửi tài liệu tham khảo.\n';
    }
    roadmap += '- Pair programming với nhóm học tập chung.\n';
  } else {
    // MEDIUM
    roadmap += '**Tuần 1: Nhắc nhở chuyên cần**\n';
    roadmap += '- Nhắc nhở sinh viên trên nền tảng học trực tuyến.\n';
    roadmap += '- Chia sẻ phương pháp học tập tối ưu thời gian.\n';
  }

  return roadmap;
}

module.exports = {
  generateInterventionRoadmap
};
