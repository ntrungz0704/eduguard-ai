const { calculateBaseRisk } = require('./riskEngine');

/**
 * Recommendation Engine (Prescriptive Analytics)
 * Phân cấp ưu tiên Hành động (HIGH, MEDIUM, LOW)
 * Phân tách rõ ràng Đề xuất cho Giảng viên (Advisor Actions) và Sinh viên (Student Actions)
 */
function generateRecommendations(student) {
  const risk = calculateBaseRisk(student);
  
  const recommendations = {
    HIGH: [],
    MEDIUM: [],
    LOW: []
  };

  const advisorActions = [];
  const studentActions = [];

  // General Interventions based on Risk level
  if (risk.level === 'CRITICAL' || risk.level === 'HIGH') {
    advisorActions.push("Liên hệ khẩn cấp với sinh viên và gửi email cảnh báo tự động từ hệ thống.");
    advisorActions.push("Hẹn lịch làm việc trực tiếp để trao đổi về lộ trình cam kết học tập.");
    
    studentActions.push("Đặt lịch gặp Cố vấn học tập (CVHT) ngay trong tuần này để thảo luận phương án khắc phục.");
    studentActions.push("Hạn chế thời gian tham gia các hoạt động ngoại khóa, làm thêm để tập trung học lại các môn yếu.");
  }

  // 1. Learning Style Mismatch recommendations
  if (risk.factors.LEARNING_STYLE_MISMATCH > 0) {
    const style = student.learningStyle;
    const career = student.careerGoal;

    advisorActions.push(`Nhắc nhở về rủi ro lệch pha: Sinh viên đang có phong cách học "${style}" nhưng định hướng ngành "${career}" yêu cầu tính thực tế/logic cao hơn.`);
    advisorActions.push("Hướng dẫn sinh viên chuyển sang phương pháp học thực chiến và vẽ sơ đồ tư duy.");

    // Tailored SV tips based on learning styles
    if (style === 'Rote learning') {
      studentActions.push("Thay đổi cách học vẹt: Ngừng ghi nhớ code mẫu máy móc, tập trung hiểu bản chất logic đằng sau.");
      studentActions.push("Thực hành vẽ sơ đồ tư duy (Mindmap) để hệ thống hóa kiến thức các môn học.");
      studentActions.push("Thử tự debug (sửa lỗi) code không dùng tài liệu hướng dẫn tối thiểu 1 tiếng mỗi ngày.");
    } else if (style === 'Theory-only') {
      studentActions.push("Bắt đầu thực hành viết code: Dành tối thiểu 2 giờ viết code thực tế mỗi ngày.");
      studentActions.push("Xây dựng các dự án mini-project mô phỏng (clone) các sản phẩm thực tế.");
      studentActions.push("Đưa toàn bộ bài tập thực hành lên GitHub cá nhân để theo dõi tiến độ.");
    } else if (style === 'Hands-on') {
      studentActions.push("Học tập qua việc xây dựng các dự án thực hành (Project-based learning).");
      studentActions.push("Tham khảo lý thuyết nền tảng từ tài liệu chính hãng để hiểu rõ cơ chế hoạt động của code.");
    } else if (style === 'Social') {
      studentActions.push("Tham gia nhóm học tập trên lớp, thảo luận bài toán cùng bạn bè để tăng tương tác.");
      studentActions.push("Tìm kiếm một bạn kèm cặp (peer tutor) có kỹ năng logic tốt hơn.");
    } else if (style === 'Self-taught') {
      studentActions.push("Tham gia các cộng đồng lập trình mở để nhận review code và cải thiện kỹ năng.");
      studentActions.push("Định hình lộ trình tự học rõ ràng theo 30/90 ngày để tránh học lan man.");
    }
  } else {
    // Default style-based tips if no mismatch
    const style = student.learningStyle;
    if (style === 'Hands-on') {
      studentActions.push("Học tập qua việc xây dựng các dự án thực tế, thực hành gõ code ngay khi học lý thuyết.");
    } else if (style === 'Analytical') {
      studentActions.push("Tập trung đào sâu thuật toán và tối ưu cấu trúc dữ liệu của các dự án.");
    } else if (style === 'Social') {
      studentActions.push("Tích cực thảo luận, học nhóm và đặt câu hỏi cho giảng viên/trợ giảng.");
    } else if (style === 'Self-taught') {
      studentActions.push("Duy trì nhịp tự học, đọc thêm sách chuyên ngành và làm các dự án mã nguồn mở.");
    }
  }

  // 2. Attendance actions
  if (risk.factors.ATTENDANCE_DROP > 0) {
    if (risk.avgAttendance < 60) {
      recommendations.HIGH.push("Liên hệ Cố vấn học tập ngay lập tức để làm đơn xin cứu xét chuyên cần.");
    } else {
      recommendations.MEDIUM.push("Đi học đầy đủ 100% các buổi còn lại để không bị cấm thi.");
    }
    advisorActions.push(`Kiểm tra tần suất đi học và nhắc nhở sinh viên chuyên cần (Hiện tại: ${Math.round(risk.avgAttendance)}%).`);
    studentActions.push("Đảm bảo đi học đầy đủ 100% các buổi học còn lại để tích lũy điểm chuyên cần và tránh bị cấm thi.");
  }

  // 3. Failed subject actions
  if (risk.failedCourses && risk.failedCourses.length > 0) {
    const listFailed = risk.failedCourses.map(c => c.courseId).join(', ');
    recommendations.HIGH.push(`Đăng ký học lại khẩn cấp môn tiên quyết bị nợ (${risk.failedCourses.slice(0, 1).map(c => c.courseId).join(', ')}).`);
    if (risk.failedCourses.length > 1) {
      recommendations.MEDIUM.push(`Tham gia phụ đạo bắt buộc môn ${risk.failedCourses[1].courseId}.`);
    }
    advisorActions.push(`Giới thiệu sinh viên tham gia lớp phụ đạo (tutor) các môn đang học yếu (${listFailed}).`);
    studentActions.push(`Chủ động đăng ký học lại sớm nhất có thể các môn đã trượt: ${listFailed}.`);
  }

  // 4. Critical Parent Action
  if (risk.level === 'CRITICAL') {
    recommendations.HIGH.unshift("Gọi điện khẩn cấp cho phụ huynh để phối hợp hỗ trợ sinh viên.");
    advisorActions.push("Gọi điện khẩn cấp cho phụ huynh học sinh để phối hợp hỗ trợ cải thiện tình hình.");
  }

  // Default recommendations if SAFE / LOW risk
  if (risk.level === 'LOW') {
    recommendations.LOW.push("Tiếp tục duy trì phong độ học tập hiện tại.");
    advisorActions.push("Khuyến khích sinh viên đăng ký tham gia các cuộc thi lập trình (Olympic, Hackathon) hoặc làm Mentor hỗ trợ các bạn khóa dưới.");
    studentActions.push("Tiếp tục phát huy phong độ học tập hiện tại. Bạn có thể tự học thêm các công nghệ nâng cao.");
  }

  return {
    HIGH: recommendations.HIGH,
    MEDIUM: recommendations.MEDIUM,
    LOW: recommendations.LOW,
    advisorActions,
    studentActions
  };
}

module.exports = {
  generateRecommendations
};
