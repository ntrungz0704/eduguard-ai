// ============================================================
// EduGuard AI — Student Response Builder (Enterprise)
// Build responses for Students (Friendly, Mentoring Tone)
// ============================================================

const { formatRiskBadge, formatConfidence, generateDynamicStudentInsight } = require('./formatter');
const { buildGpaChartData } = require('./chartBuilder');

function buildStudentFallback() {
  return {
    text: `🤖 **Mình chưa rõ ý bạn lắm.**
Bạn có muốn mình phân tích:
1. 📊 Tình hình học tập hiện tại
2. 🚨 Môn học nào đang nguy hiểm
3. 🗺 Lộ trình kéo điểm an toàn`,
    chartData: null,
    actions: ['Tình hình học tập', 'Môn nào nguy hiểm', 'Làm sao kéo điểm']
  };
}

function buildStudentOverview(data) {
  const { student, riskData } = data;
  const gpa = riskData.gpa.toFixed(1);
  const levelText = formatRiskBadge(riskData.level);
  
  const subjectsToWatch = riskData.failedCourses?.slice(0, 2).map(c => `- ${c.courseId}`).join('\n') || '- Không có môn nợ';
  const confidence = formatConfidence(riskData.riskScore);

  const text = `# 🎓 Academic Overview

Xin chào! Đây là tình hình học tập hiện tại của bạn 💙

## GPA hiện tại
🎯 GPA: **${gpa}**

## Risk Level
**${levelText}**

## 📉 Môn cần chú ý
${subjectsToWatch}

---

# 🧠 AI Insight
${generateDynamicStudentInsight(riskData)}

⚠ **Confidence:** ${confidence}

---

# 📅 Kế hoạch học tập đề xuất (Action Plan)

## Tuần 1
- Hoàn thành toàn bộ Bài tập / Lab trên lớp
- Đi học đầy đủ không vắng tiết nào

## Tuần 2
- Ôn lại kiến thức cơ bản các môn yếu
- Tham gia các nhóm học tập hoặc hỏi giảng viên

---

# 💪 Motivation
Bạn vẫn còn khả năng cải thiện rất tốt.
Đừng cố học tất cả cùng lúc. Nếu quá tải, hãy liên hệ ngay Cố vấn học tập nhé!`;

  return {
    text,
    chartData: `|||CHART_DATA:${JSON.stringify(buildGpaChartData(riskData.gpa))}|||`,
    actions: ['Môn nào nguy hiểm', 'Cách cải thiện', 'Động lực']
  };
}

function buildStudentRisk(data) {
  const { riskData } = data;
  const riskySubjects = riskData.failedCourses || [];
  
  if (riskySubjects.length === 0) {
    return {
      text: `🎉 **Tin vui!**
Hiện tại bạn không có môn học nào ở mức báo động đỏ. Hãy tiếp tục duy trì phong độ và đừng chủ quan ở các bài thi cuối kỳ nhé!`,
      chartData: null,
      actions: ['Tổng quan học tập', 'Cách cải thiện']
    };
  }

  const subjectList = riskySubjects.map(s => `- **${s.courseId}**: Điểm quá trình đang thấp hoặc vắng nhiều.`).join('\n');
  const confidence = formatConfidence(riskData.riskScore);

  return {
    text: `# 🚨 Cảnh báo Học vụ

Hệ thống ghi nhận bạn đang gặp rủi ro cao ở các môn sau:
${subjectList}

---
# 🧠 AI Insight
Đừng hoảng sợ! Hãy ưu tiên giải quyết các bài tập trên lớp của những môn này trước. Chỉ cần bạn đi học đầy đủ các buổi còn lại, cơ hội qua môn vẫn là 80%.

⚠ **Confidence:** ${confidence}`,
    chartData: null,
    actions: ['Cách cải thiện', 'Tổng quan học tập']
  };
}

function buildStudentRecommendation(data) {
  return {
    text: `# 🗺 Lộ trình kéo điểm an toàn

Để đưa GPA về mức an toàn, đây là chiến thuật tốt nhất cho bạn lúc này:

1. 🛡 **Bảo vệ điểm chuyên cần:** Đừng nghỉ thêm bất kỳ buổi nào, đặc biệt là các môn thực hành.
2. 🎯 **Tập trung Assignment:** Điểm Assignment chiếm trọng số cao. Hãy làm xong nó trước khi ôn thi lý thuyết.
3. 🤝 **Tìm kiếm sự trợ giúp:** Đừng học một mình. Gửi email cho giảng viên nhờ review bài trước khi nộp.

Bạn có thể làm được! Cứ chia nhỏ từng task ra mà làm nhé.`,
    chartData: null,
    actions: ['Tổng quan học tập', 'Động lực']
  };
}

function buildStudentMotivation(data) {
  return {
    text: `# 💪 Mình luôn ở đây để hỗ trợ bạn!

Cảm thấy áp lực là chuyện rất bình thường ở đại học. Đừng tự trách mình vì những điểm số đã qua. 

**Mọi thứ vẫn còn cứu được!**
Chỉ cần bạn bắt đầu lại ngay hôm nay, từ những bài tập nhỏ nhất. Nếu bạn thấy quá stress và không biết bắt đầu từ đâu, hãy nhắn tin ngay cho Cố vấn học tập để được gỡ rối nhé. 

Bạn không hề cô đơn trên hành trình này! 💙`,
    chartData: null,
    actions: ['Tổng quan học tập', 'Lộ trình kéo điểm']
  };
}

function buildStudentGpaSimulation(data) {
  return {
    text: `🧮 **Dự tính GPA (Mô phỏng)**

Tính năng mô phỏng điểm đang được nâng cấp. Tuy nhiên, theo quy tắc chung, nếu các môn hiện tại bạn đạt trung bình 7.0 ở kỳ thi Final, GPA tổng của bạn có thể tăng thêm 0.2 - 0.4 điểm.

Hãy cố gắng tối đa ở kỳ thi sắp tới nhé!`,
    chartData: null,
    actions: ['Lộ trình kéo điểm', 'Tổng quan học tập']
  };
}

function buildStudentResponse(decisionData) {
  if (!decisionData) return buildStudentFallback();

  switch (decisionData.type) {
    case 'STUDENT_GREETING':
      return {
        text: '👋 Xin chào! Mình là Trợ lý AI EduGuard của bạn. Hôm nay bạn muốn xem tình hình học tập, kiểm tra môn nguy hiểm hay lên lộ trình kéo điểm?',
        chartData: null,
        actions: ['Tình hình học tập', 'Môn nguy hiểm', 'Lộ trình học']
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

module.exports = {
  buildStudentResponse
};
