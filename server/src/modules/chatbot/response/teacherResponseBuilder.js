// ============================================================
// EduGuard AI — Teacher Response Builder (Enterprise)
// Build responses for Lecturers / Advisors
// ============================================================

const { formatRiskBadge, formatConfidence, formatReasons, formatTimeline, generateDynamicClassInsight } = require('./formatter');
const { buildRiskDistributionChartData, buildBottleneckChartData, buildGpaChartData } = require('./chartBuilder');
const { generateInterventionRoadmap } = require('../recommendationEngine');

function buildGreetingResponse() {
  return {
    text: `👋 **Xin chào! Tôi là Hệ thống Hỗ trợ Ra Quyết định Học vụ (DSS) EduGuard.**

Tôi đang theo dõi toàn bộ dữ liệu học thuật của sinh viên. Bạn muốn tôi phân tích gì hôm nay?`,
    chartData: null,
    actions: ['Tình hình lớp', 'Top sinh viên rủi ro', 'Môn nào dễ rớt']
  };
}

function buildSystemInfoResponse() {
  return {
    text: `⚙️ **THÔNG TIN HỆ THỐNG EDUGUARD DSS**

Tôi là một nền tảng Hybrid AI kết hợp giữa Rule-based DSS và NLP. Tôi có thể giúp Giảng viên:
1. **Explainable AI (XAI)**: Dự báo nguy cơ rớt môn và giải thích nguyên nhân rõ ràng.
2. **Class-level Analytics**: Theo dõi tình trạng sức khỏe học thuật của toàn bộ lớp học.
3. **Bottleneck Detection**: Phát hiện các môn tiên quyết gây đứt gãy dây chuyền.
4. **Intervention Roadmap**: Đề xuất các hành động can thiệp sớm (Email, Phụ đạo).

*(Gợi ý: Hãy thử hỏi "Tình hình lớp học" để xem sức mạnh phân tích của tôi)*`,
    chartData: null,
    actions: ['Tình hình lớp']
  };
}

function buildNotFoundResponse(mssv) {
  return {
    text: `❌ **Không tìm thấy dữ liệu!**
Hệ thống không tìm thấy sinh viên nào mang mã số **${mssv || 'này'}** trong cơ sở dữ liệu học vụ.

*(Gợi ý: Vui lòng kiểm tra lại MSSV hoặc hỏi "Top sinh viên rủi ro" để lấy danh sách từ hệ thống)*`,
    chartData: null,
    actions: ['Top sinh viên rủi ro', 'Tình hình lớp']
  };
}

function buildFallbackResponse(activeMssv) {
  return {
    text: activeMssv
      ? `🤖 **Tôi chưa hiểu hoàn toàn yêu cầu của bạn.**\n\nBạn đang xem hồ sơ sinh viên **${activeMssv}**. Bạn muốn:\n- Phân tích nguyên nhân (Gõ: *"nguyên nhân"*)\n- Xem chuyên cần (Gõ: *"chuyên cần"*)\n- Lộ trình can thiệp (Gõ: *"can thiệp"*)\n- Hoặc trở về Tình hình lớp học (Gõ: *"tình hình lớp"*)`
      : `🤖 **Tôi chưa hiểu hoàn toàn yêu cầu của bạn.**\n\nBạn có muốn xem:\n1. 📊 **Tình hình lớp học**\n2. 🚨 **Top sinh viên nguy cơ**\n3. 📉 **Môn dễ rớt nhất**`,
    chartData: null,
    actions: activeMssv ? ['nguyên nhân', 'chuyên cần', 'can thiệp', 'tình hình lớp'] : ['Tình hình lớp', 'Top rủi ro cao', 'Môn bottleneck']
  };
}

function buildClassAnalyticsResponse(data) {
  const { analytics, topN } = data;
  const chartData = buildRiskDistributionChartData(analytics.distribution);
  const bottleneckChart = buildBottleneckChartData(analytics.bottleneckSubjects);

  const limit = topN || 5;
  const topRiskList = analytics.topAtRisk.slice(0, limit)
    .map((s, i) => `${i + 1}. **${s.name || 'Sinh viên'}** (${s.mssv})\n   • Risk Score: ${s.riskScore}\n   • Nợ ${s.failedCourses?.length || 0} môn nền tảng`)
    .join('\n\n');

  const bottleneckStr = analytics.bottleneckSubjects.slice(0, 3)
    .map((b) => `- **${b.courseId}** — Fail Rate: ${analytics.total ? Math.round((b.failCount / analytics.total) * 100) : b.failCount}%`)
    .join('\n');

  // Lấy risk score trung bình hoặc cao nhất để tính confidence
  const maxRisk = analytics.topAtRisk[0]?.riskScore || 0;
  const confidence = formatConfidence(maxRisk);

  const text = `# 📊 Class Analytics Dashboard

## Tổng sinh viên
**${analytics.total || 'N/A'}**

🟢 LOW: ${analytics.lows || 0}
🟡 MEDIUM: ${analytics.mediums || 0}
🟠 HIGH: ${analytics.highs || 0}
🔴 CRITICAL: ${analytics.criticals || 0}

---

# 🚨 TOP ${limit} HIGH-RISK STUDENTS

${topRiskList || '✅ Không có sinh viên nguy cơ cao.'}

---

# 📉 Bottleneck Subjects

${bottleneckStr || '✅ Không có môn học đáng lo ngại.'}

---

# 🧠 AI Insight
${generateDynamicClassInsight(analytics)}

⚠ **Confidence:** ${confidence}

# 🎯 Recommended Actions
- Liên hệ ngay với nhóm CRITICAL trong tuần này
- Đề xuất mở lớp phụ đạo cho môn ${analytics.bottleneckSubjects[0]?.courseId || 'Bottleneck'}
- Theo dõi chuyên cần hàng tuần
`;

  return {
    text,
    chartData: `|||CHART_DATA:${JSON.stringify(chartData)}||| |||CHART_DATA:${JSON.stringify(bottleneckChart)}|||`,
    actions: ['phân tích sinh viên đầu tiên', 'xem chuyên cần', 'lộ trình can thiệp']
  };
}

function buildStudentAnalyticsResponse(data) {
  const { student, riskData, timeline } = data;
  const gpa = riskData.gpa;
  const rank = gpa >= 8.0 ? 'Giỏi' : gpa >= 6.5 ? 'Khá' : gpa >= 5.0 ? 'Trung bình' : 'Yếu';
  const chartData = buildGpaChartData(gpa);
  const confidence = formatConfidence(riskData.riskScore);

  const text = `# 🎯 HỒ SƠ PHÂN TÍCH DSS — ${student.name || student.mssv}

👤 **MSSV:** \`${student.mssv}\` | Lớp: ${student.classCode || 'N/A'}
🎯 **GPA Tích lũy:** ${gpa.toFixed(1)}/10 (*Xếp loại: ${rank}*)
⚠ **Risk Level:** ${formatRiskBadge(riskData.level, riskData.riskScore)}

---

# 📉 Phân rã nguyên nhân (XAI)
${formatReasons(riskData.reasons)}

---

# 🧠 AI Insight
Nhóm sinh viên có mức điểm tương đương thường gặp khó khăn ở các môn logic. Việc cải thiện Attendance và làm lại Lab sẽ tăng tỷ lệ qua môn lên 75%.

⚠ **Confidence:** ${confidence}

---

# ⏳ Academic Timeline
${formatTimeline(timeline)}
`;

  return {
    text,
    chartData: `|||CHART_DATA:${JSON.stringify(chartData)}|||`,
    actions: ['nguyên nhân cốt lõi', 'đề xuất can thiệp', 'tình hình lớp']
  };
}

function buildFollowupResponse(data) {
  const { followupType, student, riskData, timeline } = data;
  const gpa = riskData.gpa;
  const chartData = buildGpaChartData(gpa);
  const chartStr = `|||CHART_DATA:${JSON.stringify(chartData)}|||`;
  const studentName = student.name || student.mssv;
  const confidence = formatConfidence(riskData.riskScore);

  switch (followupType) {
    case 'ROOT_CAUSE': {
      return {
        text: `# ⚠️ GIẢI THÍCH NGUYÊN NHÂN CỐT LÕI (XAI)
👤 **Sinh viên:** ${studentName}

**Phân rã chi tiết theo trọng số thuật toán:**
${formatReasons(riskData.reasons)}

---
🧠 **AI Insight**: Sự đứt gãy kiến thức ở các môn nền tảng sẽ gây nguy cơ dây chuyền cho 34+ môn phụ thuộc tiếp theo.
⚠ **Confidence**: ${confidence}
${chartStr}`,
        chartData: chartStr,
        actions: ['đề xuất can thiệp', 'timeline', 'chuyên cần']
      };
    }

    case 'ATTENDANCE': {
      const cc = Math.round(riskData.avgAttendance);
      const status = cc < 60 ? '🔴 Nguy cơ cấm thi' : cc < 75 ? '🟠 Yếu' : cc < 85 ? '🟡 Trung bình' : '🟢 Ổn định';
      return {
        text: `# 📅 PHÂN TÍCH CHUYÊN CẦN
👤 **Sinh viên:** ${studentName}
📉 **Tỷ lệ chuyên cần:** ${cc}% (${status})

# 🎯 Khuyến nghị hành động
${cc < 75 ? '- Liên hệ phụ huynh ngay\n- Gửi cảnh báo cấm thi' : '- Khích lệ duy trì'}
${chartStr}`,
        chartData: chartStr,
        actions: ['nguyên nhân cốt lõi', 'đề xuất can thiệp']
      };
    }

    case 'INTERVENTION': {
      const roadmap = generateInterventionRoadmap(student, riskData);
      return {
        text: `# 💊 ĐỀ XUẤT CAN THIỆP CHUYÊN SÂU
👤 **Sinh viên:** ${studentName}

${roadmap}
${chartStr}`,
        chartData: chartStr,
        actions: ['chuyên cần', 'timeline']
      };
    }

    case 'TIMELINE': {
      return {
        text: `# ⏳ LỘ TRÌNH THEO DÕI HỌC VỤ
👤 **Sinh viên:** ${studentName}

${formatTimeline(timeline) || 'Chưa ghi nhận sự kiện cảnh báo đặc biệt.'}
${chartStr}`,
        chartData: chartStr,
        actions: ['nguyên nhân', 'đề xuất can thiệp']
      };
    }

    default:
      return buildStudentAnalyticsResponse(data);
  }
}

function buildTeacherResponse(decisionData) {
  if (!decisionData) return buildFallbackResponse(null);

  switch (decisionData.type) {
    case 'GREETING':
      return buildGreetingResponse();
    case 'SYSTEM_INFO':
      return buildSystemInfoResponse();
    case 'SYLLABUS_INFO':
      return {
        text: `# 📚 Thông tin Syllabus (Đề cương môn học)\n\nĐề cương môn học (Syllabus) là tài liệu quan trọng mô tả chi tiết mục tiêu, nội dung giảng dạy, phương pháp đánh giá và tài liệu tham khảo của môn học.\n\n${decisionData.courseId ? `Bạn đang hỏi về môn **${decisionData.courseId}**. Bạn có thể tra cứu Syllabus chi tiết trên hệ thống LMS hoặc AP.` : 'Bạn cần hỏi thông tin Syllabus của môn nào cụ thể? (VD: Syllabus môn WEB206)'}`,
        chartData: null,
        actions: ['Tình hình lớp']
      };
    case 'STUDENT_ANALYTICS':
      return buildStudentAnalyticsResponse(decisionData);
    case 'CLASS_ANALYTICS':
      return buildClassAnalyticsResponse(decisionData);
    case 'RISK_RANKING': {
      const dist = decisionData.distribution || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      const total = dist.CRITICAL + dist.HIGH + dist.MEDIUM + dist.LOW;
      return buildClassAnalyticsResponse({
        topN: decisionData.topN,
        analytics: {
          total: total,
          criticals: dist.CRITICAL,
          highs: dist.HIGH,
          mediums: dist.MEDIUM,
          lows: dist.LOW,
          topAtRisk: decisionData.topAtRisk,
          bottleneckSubjects: decisionData.bottleneck || [],
          distribution: dist
        }
      });
    }
    case 'FOLLOWUP_ROOT_CAUSE':
    case 'FOLLOWUP_ATTENDANCE':
    case 'FOLLOWUP_INTERVENTION':
    case 'FOLLOWUP_TIMELINE':
    case 'FOLLOWUP_STRENGTH':
    case 'FOLLOWUP_GPA_DETAIL':
      return buildFollowupResponse(decisionData);
    case 'STUDENT_NOT_FOUND':
      return buildNotFoundResponse(decisionData.mssv);
    case 'FALLBACK':
    default:
      return buildFallbackResponse(decisionData.activeMssv);
  }
}

module.exports = {
  buildTeacherResponse
};
