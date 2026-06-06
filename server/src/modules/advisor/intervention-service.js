exports.generateIntervention = async (mssv, analysis) => {
  const emailDraft = `
Tiêu đề: [Khẩn cấp] Cảnh báo Học vụ & Lộ trình 14 ngày kéo điểm
Gửi sinh viên ${mssv},

Hệ thống phát hiện bạn đang có mức độ rủi ro ${analysis.riskLevel} (${analysis.priority}).
Nguyên nhân chính:
${analysis.riskFactors.map(f => `- ${f.message}`).join('\n')}

Điều này ảnh hưởng tới lộ trình ${analysis.careerGoal} và các môn tiếp theo: ${analysis.impactedCourses.slice(0,3).join(', ')}.

Đây là lộ trình kéo điểm dành riêng cho bạn:
${analysis.recommendations.map(r => `* ${r.type}: ${r.message}`).join('\n')}

Hãy liên hệ CVHT ngay lập tức nếu cần hỗ trợ.
Trân trọng,
EduGuard AI Coach
  `.trim();

  return {
    mssv,
    status: "DRAFT_CREATED",
    emailDraft,
    message: "Đã tạo draft email thành công chờ CVHT duyệt."
  };
};
