// ============================================================
// EduGuard AI — Student Response Builder
// Formatting responses for students (Encouraging tone)
// ============================================================

const { buildGpaChartData } = require('./responseBuilder');

function buildStudentResponse(decisionData) {
  if (!decisionData) return buildStudentFallback(null);

  switch (decisionData.type) {
    case 'STUDENT_GREETING':
      return {
        text: '👋 Xin chào! Mình là Trợ lý AI EduGuard của bạn. Hôm nay bạn muốn xem tình hình học tập, kiểm tra môn nguy hiểm hay lên lộ trình kéo điểm?',
        chartData: null,
        actions: ['Tình hình học tập', 'Môn nào nguy hiểm', 'Cách kéo điểm']
      };

    case 'STUDENT_OVERVIEW':
      return buildStudentOverview(decisionData);

    case 'STUDENT_RISK':
      return buildStudentRisk(decisionData);

    case 'STUDENT_RECOMMENDATION':
      return buildStudentRecommendation(decisionData);

    case 'STUDENT_MOTIVATION':
      return buildStudentMotivation(decisionData);

    case 'STUDENT_GPA_SIMULATION':
      return buildStudentGpaSimulation(decisionData);

    case 'NEED_LOGIN':
      return { text: '⚠ Bạn cần đăng nhập tài khoản sinh viên để sử dụng chức năng này.' };

    case 'STUDENT_FALLBACK':
    default:
      return buildStudentFallback();
  }
}

function buildStudentOverview(data) {
  const { student, riskData } = data;
  const gpa = riskData.gpa.toFixed(1);
  const trend = riskData.level === 'CRITICAL' ? 'Đang giảm sút' : (gpa > 6.5 ? 'Đang duy trì tốt' : 'Cần nỗ lực hơn');
  const levelText = riskData.level === 'CRITICAL' ? '🔴 CRITICAL' : riskData.level === 'HIGH' ? '🟠 HIGH RISK' : riskData.level === 'MEDIUM' ? '🟡 MEDIUM RISK' : '🟢 LOW RISK';
  
  const subjectsToWatch = riskData.failedCourses?.slice(0, 2).map(c => `- ${c.courseId}`).join('\n') || '- Không có môn nợ';
  const confidence = riskData.riskScore > 80 ? 'High' : 'Medium';

  const text = `# 🎓 Academic Overview

Xin chào! Đây là tình hình học tập hiện tại của bạn 💙

## GPA hiện tại
🎯 GPA: **${gpa}**

## Risk Level
**${levelText}**

## Môn cần chú ý
${subjectsToWatch}

---

🧠 **AI Insight**
${riskData.level === 'CRITICAL' || riskData.level === 'HIGH'
  ? 'Bạn đang có dấu hiệu giảm điểm ở các môn thực hành hoặc điểm danh. Nếu cải thiện Assignment trong 2 tuần tới, GPA vẫn có thể tăng đáng kể.'
  : 'Bạn đang giữ phong độ khá ổn định. Cố gắng duy trì chuyên cần và tập trung vào các môn chuyên ngành nhé!'}

⚠ **Confidence:** ${confidence}

---

# 📅 Kế hoạch học tập đề xuất

## Tuần 1
- Hoàn thành toàn bộ Bài tập / Lab trên lớp
- Đi học đầy đủ không vắng tiết nào

## Tuần 2
- Ôn lại kiến thức cơ bản các môn yếu
- Tham gia các nhóm học tập hoặc hỏi giảng viên

---

💪 **Motivation**
Bạn vẫn còn khả năng cải thiện rất tốt.
Hãy tập trung từng môn một thay vì cố học tất cả cùng lúc. Nếu quá tải, hãy liên hệ ngay Cố vấn học tập nhé!`;

  return {
    text,
    chartData: `|||CHART_DATA:${JSON.stringify(buildGpaChartData(riskData.gpa))}|||`,
    actions: ['Môn nào nguy hiểm', 'Làm sao kéo điểm', 'Động lực học']
  };
}

function buildStudentRisk(data) {
  const { riskData } = data;
  
  let text = `⚠ **CÁC MÔN CÓ NGUY CƠ CAO**\n\n`;
  if (riskData.failedCourses && riskData.failedCourses.length > 0) {
    riskData.failedCourses.forEach((c, i) => {
      text += `${i + 1}. **${c}**\n   ❌ Đang nợ hoặc rớt môn\n   ❌ Ảnh hưởng tới môn tiên quyết\n\n`;
    });
    text += `💡 **Gợi ý:** Hãy làm thủ tục đăng ký học lại sớm nhất có thể nhé.`;
  } else {
    text += `✅ **Tin vui:** Hiện tại bạn không nợ môn nào quá nguy hiểm!\n\n💡 Cứ tiếp tục duy trì chuyên cần >80% là qua môn dễ dàng.`;
  }

  return {
    text,
    chartData: null,
    actions: ['Cách kéo điểm', 'Tính thử GPA']
  };
}

function buildStudentRecommendation(data) {
  const { riskData } = data;
  const reasons = riskData.reasons.map(r => r.factor);
  
  let text = `🎯 **KẾ HOẠCH HỌC TẬP GỢI Ý CHO BẠN**\n\n`;
  
  if (reasons.includes('Nợ môn nền tảng')) {
    text += `📌 **Ưu tiên 1: Lấp lỗ hổng kiến thức**
- Đăng ký học lại các môn nền tảng đang nợ.
- Chủ động nhắn tin cho Giảng viên hoặc Mentor để xin tài liệu bổ trợ.

`;
  }
  if (reasons.includes('Chuyên cần thấp')) {
    text += `📌 **Ưu tiên 2: Cải thiện điểm danh**
- Đi học đầy đủ trong 3 tuần tới để không bị cấm thi.
- Cài báo thức nhắc nhở học tập hàng ngày.

`;
  }
  
  if (riskData.level === 'LOW') {
    text += `📌 **Ưu tiên tuần này:**
- Làm xong Assignment trước hạn.
- Tìm hiểu thêm các khóa học nâng cao (Ví dụ: React, Node.js).
`;
  }

  text += `⏱ **Khuyến nghị AI:** Hãy dành ít nhất 2h/ngày trong 5 ngày tới để bám sát kế hoạch này nhé!`;

  return {
    text,
    chartData: null,
    actions: ['Tình hình học tập', 'Môn nguy hiểm']
  };
}

function buildStudentMotivation(data) {
  const { riskData } = data;
  
  return {
    text: `💙 **Bạn vẫn còn khả năng cải thiện!**

Dữ liệu của hệ thống cho thấy bạn hoàn toàn có thể lật ngược tình thế:
- GPA của bạn là **${riskData.gpa.toFixed(1)}**, bạn vẫn còn cơ hội kéo điểm bằng Assignment và Final.
- Hệ thống phát hiện rất nhiều bạn từng ở mức Risk Score ${riskData.riskScore} nhưng cuối kỳ vẫn qua môn thành công.

🎯 **Gợi ý từ AI:**
Đừng cố học tất cả cùng lúc. Hãy ưu tiên môn dễ qua nhất để lấy lại sự tự tin. Bạn không đơn độc, hãy liên hệ Cố vấn học tập nếu thấy quá tải nhé!`,
    chartData: null,
    actions: ['Cách kéo điểm', 'Tình hình học tập']
  };
}

function buildStudentGpaSimulation(data) {
  return {
    text: `📊 **GPA SIMULATION (Dự phóng điểm số)**

Tính năng mô phỏng GPA đang được cập nhật thêm dựa trên phổ điểm lịch sử.
Tuy nhiên, nguyên tắc chung là:
- Nếu bạn đạt Final: **8.0**
- Assignment: **7.5**
➡ Khả năng cao bạn sẽ qua môn một cách an toàn!

*(Gợi ý: Cố gắng cày Assignment từ bây giờ để giảm áp lực cho bài thi Final nhé)*`,
    chartData: null,
    actions: ['Làm sao kéo điểm', 'Tình hình học tập']
  };
}

function buildStudentFallback() {
  return {
    text: `🤖 **Mình chưa hiểu rõ ý bạn lắm.**\n\nBạn có muốn trợ lý AI của EduGuard hỗ trợ:\n1. 📊 Xem tổng quan học lực\n2. ⚠ Kiểm tra môn nào dễ rớt\n3. 🎯 Gợi ý lộ trình cải thiện điểm\n4. 💙 Lấy lại động lực học tập\n\n*(Gợi ý: Hãy bấm vào các nút bên dưới)*`,
    chartData: null,
    actions: ['Tình hình học tập', 'Làm sao kéo điểm', 'Động lực học']
  };
}

module.exports = {
  buildStudentResponse
};
