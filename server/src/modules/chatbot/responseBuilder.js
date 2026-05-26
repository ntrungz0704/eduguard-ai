// ============================================================
// EduGuard AI — Response Builder
// Converts structured AI decision data into human-readable responses
// ============================================================


const { generateClassInsight, generateStudentInsight } = require('./insightGenerator');
const { generateInterventionRoadmap } = require('./recommendationEngine');

/**
 * Build GPA chart data payload for frontend rendering.
 */
function buildGpaChartData(gpa) {
  const mockTrend = gpa >= 8.0
    ? [7.5, 7.8, 8.2]
    : gpa >= 6.5
    ? [6.5, 6.8, 7.0]
    : gpa >= 5.0
    ? [7.5, 6.5, 5.5]
    : [6.0, 5.0, 4.0];

  return {
    type: 'gpa',
    data: [
      { semester: 'HK1', gpa: mockTrend[0] },
      { semester: 'HK2', gpa: mockTrend[1] },
      { semester: 'HK3', gpa: mockTrend[2] },
      { semester: 'HK4', gpa: parseFloat(gpa.toFixed(1)) }
    ]
  };
}

/**
 * Build risk distribution chart data for frontend.
 */
function buildRiskDistributionChartData(distribution) {
  return {
    type: 'risk_distribution',
    data: [
      { name: 'CRITICAL', value: distribution.CRITICAL, fill: '#ef4444' },
      { name: 'HIGH', value: distribution.HIGH, fill: '#f97316' },
      { name: 'MEDIUM', value: distribution.MEDIUM, fill: '#eab308' },
      { name: 'LOW', value: distribution.LOW, fill: '#22c55e' }
    ]
  };
}

/**
 * Build bottleneck chart data.
 */
function buildBottleneckChartData(bottleneckSubjects) {
  return {
    type: 'bottleneck',
    data: bottleneckSubjects.map(b => ({
      name: b.courseId,
      failCount: b.failCount
    }))
  };
}

/**
 * Format risk level badge string.
 */
function formatRiskBadge(level, riskScore) {
  const map = {
    CRITICAL: `🔴 CRITICAL (${riskScore}/100)`,
    HIGH: `🟠 HIGH (${riskScore}/100)`,
    MEDIUM: `🟡 MEDIUM (${riskScore}/100)`,
    LOW: `🟢 LOW (${riskScore}/100)`
  };
  return map[level] || `⚪ ${level} (${riskScore}/100)`;
}

/**
 * Format reasons list for display.
 */
function formatReasons(reasons) {
  if (!reasons || reasons.length === 0) {
    return '- ✅ Không phát hiện yếu tố rủi ro đáng kể.';
  }
  return reasons
    .map(r => `- **${r.factor}** [${r.weight}]: +${r.impact} pts — ${r.detail}`)
    .join('\n');
}

/**
 * Format timeline for display.
 */
function formatTimeline(timeline) {
  if (!timeline || timeline.length === 0) {
    return 'Chưa ghi nhận sự kiện bất thường.';
  }
  const typeEmoji = {
    CRITICAL: '🚨',
    DANGER: '⚠️',
    WARNING: '🔔',
    INFO: 'ℹ️',
    SUCCESS: '✅',
    INTERVENTION: '💊'
  };
  return timeline
    .map(t => `**Tuần ${t.week}** ${typeEmoji[t.type] || '•'} ${t.event}`)
    .join('\n');
}

// ============================================================
// Response Builders per Decision Type
// ============================================================

function buildGreetingResponse() {
  return {
    text: `👋 Chào bạn! Tôi là **EduGuard AI — Hybrid DSS (Decision Support System)**.

Tôi hỗ trợ cố vấn học tập:
• 📊 **Risk Analysis (XAI):** Đánh giá rủi ro học tập có giải thích nguyên nhân
• 📈 **Academic Timeline:** Giám sát lộ trình cảnh báo theo tuần
• 🔗 **Dependency Chain:** Theo dõi chuỗi 34 môn, phát hiện đứt gãy
• 🏫 **Class Analytics:** Thống kê toàn lớp, phân phối rủi ro, bottleneck
• 💡 **DSS Actions:** Đề xuất can thiệp cụ thể cho Cố vấn học tập (CVHT)

Nhập **MSSV sinh viên** (VD: *PS47261*) hoặc hỏi **"tình hình lớp"** để bắt đầu.`,
    chartData: null,
    actions: ['Phân tích sinh viên', 'Tình hình lớp', 'Top rủi ro cao', 'Môn bottleneck']
  };
}

function buildSystemInfoResponse() {
  return {
    text: `⚙️ **KIẾN TRÚC EDUGUARD AI DSS v3.0**

**1. NLP Orchestrator Layer**
\`User Input → Intent Router → Context Resolver → Role Validator → Entity Extractor → AI Decision Engine → Response Builder\`

**2. DSS Risk Engine (Weighted Intelligence)**
| Factor | Weight | Trigger |
|--------|--------|---------|
| Nợ môn | 40% | Score < 5.0 |
| Chuyên cần | 25% | CC < 80% |
| Lab/Thực hành | 15% | Lab < 5.0 |
| Đứt gãy tiên quyết | 10% | Rớt nền tảng |
| Xu hướng giảm | 10% | Trend decline |

**3. Explainable AI (XAI):** Mọi Risk Score đều có phân rã nguyên nhân chi tiết.

**4. Event-driven Monitoring:** Tự động phát sự kiện khi chuyên cần < 60%, rớt tiên quyết, leo thang risk.

**5. Cache Layer:** Class analytics & risk ranking được cache 5 phút để tối ưu hiệu năng.`,
    chartData: null,
    actions: null
  };
}

function buildStudentAnalyticsResponse(data) {
  const { student, riskData, timeline } = data;
  const gpa = riskData.gpa;
  const rank = gpa >= 8.0 ? 'Giỏi' : gpa >= 6.5 ? 'Khá' : gpa >= 5.0 ? 'Trung bình' : 'Yếu';
  const chartData = buildGpaChartData(gpa);

  const text = `🎯 **HỒ SƠ PHÂN TÍCH DSS — ${student.name || student.mssv}**
MSSV: \`${student.mssv}\` | Lớp: ${student.classCode || 'N/A'}

---
📊 **GPA Tích lũy:** **${gpa.toFixed(1)}/10** *(Xếp loại: ${rank})*

⚠️ **EXPLAINABLE RISK SCORE (XAI)**
Mức độ rủi ro: **${formatRiskBadge(riskData.level, riskData.riskScore)}**

**Phân rã nguyên nhân (theo trọng số):**
${formatReasons(riskData.reasons)}

${generateStudentInsight(riskData)}

---
⏳ **ACADEMIC TIMELINE — Monitoring**
${formatTimeline(timeline)}

---
💡 **Bạn có thể hỏi thêm:**
→ *"nguyên nhân"* — Giải thích XAI chi tiết
→ *"chuyên cần"* — Phân tích chuyên cần
→ *"can thiệp"* — Đề xuất hành động CVHT
→ *"timeline"* — Lộ trình leo thang
→ *"điểm mạnh"* — Môn học xuất sắc`;

  return {
    text,
    chartData: `|||CHART_DATA:${JSON.stringify(chartData)}|||`,
    actions: ['nguyên nhân', 'chuyên cần', 'can thiệp', 'timeline', 'điểm mạnh']
  };
}

function buildClassAnalyticsResponse(data) {
  const { analytics, topN } = data;
  const chartData = buildRiskDistributionChartData(analytics.distribution);
  const bottleneckChart = buildBottleneckChartData(analytics.bottleneckSubjects);

  const limit = topN || 5;
  const topRiskList = analytics.topAtRisk.slice(0, limit)
    .map((s, i) => `${i + 1}. **${s.name || 'Sinh viên'}** (${s.mssv}) — Risk Score: ${s.riskScore} (${formatRiskBadge(s.level, s.riskScore)})`)
    .join('\n');

  const bottleneckStr = analytics.bottleneckSubjects.slice(0, 3)
    .map((b) => `- **${b.courseId}** — Fail Rate: ${analytics.total ? Math.round((b.failCount / analytics.total) * 100) : b.failCount}%`)
    .join('\n');

  const text = `# 📊 Class Analytics Overview

## Tổng quan lớp học
- Total Students: **${analytics.total || 'N/A'}**
- 🔴 Critical: **${analytics.criticals || 0}**
- 🟠 High Risk: **${analytics.highs || 0}**
- 🟡 Medium Risk: **${analytics.mediums || 0}**
- 🟢 Stable: **${analytics.lows || 0}**

---

# 🚨 Top Students Requiring Immediate Intervention

${topRiskList || '✅ Không có sinh viên nguy cơ cao.'}

---

# 📉 Bottleneck Subjects

${bottleneckStr || '✅ Không có môn học đáng lo ngại.'}

---

🧠 **AI Insight**
Phần lớn Risk Score toàn lớp xuất phát từ nhóm môn Bottleneck và nhóm sinh viên nợ tín chỉ kéo dài. Sự sụt giảm chuyên cần ở các môn kỹ năng chuyên ngành đang tạo ra hiệu ứng dây chuyền.

⚠ **Confidence:** High

🎯 **Recommended Actions**
- Liên hệ ngay với nhóm sinh viên **CRITICAL** trong tuần này
- Đề xuất mở lớp phụ đạo hoặc Tutor cho môn ${analytics.bottleneckSubjects[0]?.courseId || 'Bottleneck'}
- Theo dõi sát sao Attendance theo từng tuần`;

  return {
    text,
    chartData: `|||CHART_DATA:${JSON.stringify(chartData)}||| |||CHART_DATA:${JSON.stringify(bottleneckChart)}|||`,
    actions: ['Top rủi ro cao', 'Môn bottleneck', 'Đề xuất can thiệp']
  };
}

function buildFollowupResponse(data) {
  const { followupType, student, riskData, timeline } = data;
  const gpa = riskData.gpa;
  const chartData = buildGpaChartData(gpa);
  const chartStr = `|||CHART_DATA:${JSON.stringify(chartData)}|||`;
  const studentName = student.name || student.mssv;

  switch (followupType) {
    case 'ROOT_CAUSE': {
      const explanationStr = formatReasons(riskData.reasons);
      return {
        text: `⚠️ **GIẢI THÍCH NGUYÊN NHÂN CỐT LÕI (XAI)**
👨‍🎓 Sinh viên: **${studentName}**
📈 Risk Score: **${formatRiskBadge(riskData.level, riskData.riskScore)}**

**Phân rã chi tiết theo trọng số:**
${explanationStr}

💡 *Sự đứt gãy kiến thức ở các môn nền tảng sẽ gây nguy cơ dây chuyền cho 34+ môn phụ thuộc tiếp theo.*${chartStr}`,
        chartData: chartStr,
        actions: ['can thiệp', 'timeline', 'chuyên cần']
      };
    }

    case 'ATTENDANCE': {
      const cc = Math.round(riskData.avgAttendance);
      const status = cc < 60
        ? '🔴 **Nguy cơ cấm thi rất cao** — Cần can thiệp khẩn cấp'
        : cc < 75
        ? '🟠 **Chuyên cần rất thấp** — Cần chấn chỉnh ngay'
        : cc < 85
        ? '🟡 **Chuyên cần giảm sút** — Cần theo dõi sát'
        : '🟢 **Chuyên cần ổn định**';

      return {
        text: `📅 **PHÂN TÍCH CHUYÊN CẦN (ATTENDANCE)**
👨‍🎓 Sinh viên: **${studentName}**

📉 Tỷ lệ chuyên cần trung bình: **${cc}%**
Trạng thái: ${status}

💡 **Khuyến nghị:**
${cc < 60
  ? '- 🚨 Liên hệ phụ huynh và yêu cầu báo cáo ngay\n- Gửi cảnh báo chính thức về nguy cơ cấm thi\n- Gặp mặt sinh viên trực tiếp trong tuần này'
  : cc < 80
  ? '- Gọi điện nhắc nhở sinh viên và theo dõi 2 tuần tới\n- Yêu cầu cam kết cải thiện chuyên cần bằng văn bản'
  : '- Tiếp tục theo dõi và khích lệ duy trì'}${chartStr}`,
        chartData: chartStr,
        actions: ['can thiệp', 'nguyên nhân']
      };
    }

    case 'INTERVENTION': {
      const roadmap = generateInterventionRoadmap(student, riskData);
      return {
        text: `💊 **ĐỀ XUẤT CAN THIỆP CHUYÊN SÂU**
👨‍🎓 Sinh viên: **${studentName}**

${roadmap}

*(Gợi ý: Cố vấn học tập có thể gửi email cảnh báo tự động cho sinh viên ngay lúc này.)*${chartStr}`,
        chartData: chartStr,
        actions: ['nguyên nhân', 'chuyên cần', 'timeline']
      };
    }

    case 'TIMELINE': {
      const timelineStr = formatTimeline(timeline);
      return {
        text: `⏳ **LỘ TRÌNH THEO DÕI HỌC VỤ (ACADEMIC TIMELINE)**
👨‍🎓 Sinh viên: **${studentName}**

**Chi tiết sự kiện cảnh báo:**
${timelineStr || 'Chưa ghi nhận sự kiện cảnh báo đặc biệt.'}${chartStr}`,
        chartData: chartStr,
        actions: ['can thiệp', 'nguyên nhân']
      };
    }

    case 'STRENGTH': {
      const passedCourses = (student.scores || []).filter(s => s.status === 'PASSED' && s.value >= 7);
      const strengthStr = passedCourses.length > 0
        ? passedCourses.map(s => `- **${s.courseId}**: ${s.value?.toFixed(1)} điểm`).join('\n')
        : '- Không phát hiện môn học nổi trội (≥7.0). Sinh viên cần nỗ lực đồng đều hơn.';

      return {
        text: `🌟 **ĐIỂM SÁNG HỌC THUẬT (STRENGTH ANALYSIS)**
👨‍🎓 Sinh viên: **${studentName}**

**Các môn thế mạnh (≥7.0 điểm):**
${strengthStr}

💡 *Tập trung khai thác thế mạnh này làm đòn bẩy bù đắp các lỗ hổng chuyên ngành.*${chartStr}`,
        chartData: chartStr,
        actions: ['can thiệp', 'nguyên nhân']
      };
    }

    default:
      return buildStudentAnalyticsResponse(data);
  }
}

function buildNotFoundResponse(mssv) {
  return {
    text: `🔍 **Không tìm thấy sinh viên**

Không tìm thấy dữ liệu cho MSSV: \`${mssv}\`

**Gợi ý:**
- Kiểm tra lại MSSV (định dạng: PS + 5 chữ số, VD: *PS47261*)
- Sinh viên chưa có dữ liệu trong hệ thống hoặc chưa upload dữ liệu lớp`,
    chartData: null,
    actions: ['Tình hình lớp', 'Top rủi ro cao']
  };
}

function buildNeedMssvResponse(hasActiveStudent) {
  return {
    text: hasActiveStudent
      ? `❓ Bạn muốn hỏi về sinh viên nào? Hãy nhập MSSV (VD: *PS47261*) hoặc tôi có thể tiếp tục phân tích sinh viên đang active.`
      : `❓ **Vui lòng cung cấp MSSV sinh viên**

Nhập MSSV để tôi phân tích (VD: *PS47261*, *PC12345*, *PK00001*)

Hoặc hỏi về toàn lớp: *"tình hình lớp"*, *"top sinh viên rủi ro"*`,
    chartData: null,
    actions: ['Tình hình lớp', 'Top rủi ro cao']
  };
}

function buildFallbackResponse(activeMssv) {
  return {
    text: activeMssv
      ? `🤖 **Tôi chưa hiểu hoàn toàn yêu cầu của bạn.**\n\nBạn đang phân tích sinh viên **${activeMssv}**. Bạn có muốn xem:\n1. ⚠️ **Nguyên nhân rủi ro (XAI)**\n2. 📅 **Tình trạng chuyên cần**\n3. 💊 **Đề xuất can thiệp**\n4. ⏳ **Lộ trình học tập**\n5. 🌟 **Phân tích điểm mạnh**\n\n*(Gợi ý: Hãy chọn một trong các thao tác trên hoặc gõ "tình hình lớp" để về màn hình chính)*`
      : `🤖 **Tôi chưa hiểu hoàn toàn yêu cầu của bạn.**\n\nBạn có muốn:\n1. 📊 **Xem top sinh viên rủi ro** (Gõ: *"top sinh viên rủi ro"*)\n2. 📈 **Xem tình hình lớp học** (Gõ: *"tình hình lớp"*)\n3. 👨‍🎓 **Phân tích 1 sinh viên** (Gõ: MSSV, VD: *"PS47261"*)\n4. ⚙️ **Tìm hiểu hệ thống** (Gõ: *"kiến trúc hệ thống"*)\n\n*(Gợi ý: Bạn có thể chọn các nút thao tác nhanh ở bên dưới)*`,
    chartData: null,
    actions: ['Tình hình lớp', 'Top rủi ro cao', 'help']
  };
}

// ============================================================
// Main buildResponse Entry Point
// ============================================================

/**
 * Build user-facing response from AI decision data.
 * @param {object} decisionData - Output from aiDecisionEngine.executeDecision()
 * @returns {{ text: string, chartData: string|null, actions: string[]|null }}
 */
function buildResponse(decisionData) {
  if (!decisionData) return buildFallbackResponse(null);

  switch (decisionData.type) {
    case 'GREETING':
      return buildGreetingResponse();

    case 'SYSTEM_INFO':
      return buildSystemInfoResponse();

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

    case 'NEED_MSSV':
    case 'NEED_ACTIVE_STUDENT':
      return buildNeedMssvResponse(false);

    case 'FALLBACK':
    default:
      return buildFallbackResponse(decisionData.activeMssv);
  }
}

module.exports = {
  buildResponse,
  buildGpaChartData,
  buildRiskDistributionChartData,
  buildBottleneckChartData
};
