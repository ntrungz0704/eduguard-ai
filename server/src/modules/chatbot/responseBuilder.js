// ============================================================
// EduGuard AI — Response Builder
// Converts structured AI decision data into human-readable responses
// ============================================================

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
  const { analytics } = data;
  const chartData = buildRiskDistributionChartData(analytics.distribution);
  const bottleneckChart = buildBottleneckChartData(analytics.bottleneckSubjects);

  const topRisk = analytics.topAtRisk.slice(0, 3)
    .map(s => `- **${s.mssv}** (${s.name || 'N/A'}): ${formatRiskBadge(s.level, s.riskScore)} | Nợ ${s.failedCourses?.length || 0} môn`)
    .join('\n');

  const bottleneckStr = analytics.bottleneckSubjects.slice(0, 5)
    .map((b, i) => `${i + 1}. **${b.courseId}** — ${b.failCount} sinh viên failed`)
    .join('\n');

  const text = `📈 **PHÂN TÍCH QUẢN TRỊ LỚP HỌC (CLASS ANALYTICS)**
Tổng số sinh viên: **${analytics.total}**

**Phân phối rủi ro:**
🔴 CRITICAL: **${analytics.criticals}** SV | 🟠 HIGH: **${analytics.highs}** SV
🟡 MEDIUM: **${analytics.mediums}** SV | 🟢 LOW: **${analytics.lows}** SV

---
🚨 **Top 3 Sinh viên cần can thiệp khẩn cấp:**
${topRisk || '- Không có sinh viên ở mức CRITICAL.'}

---
🔥 **Môn Bottleneck (Tỷ lệ fail cao nhất):**
${bottleneckStr || '- Không có dữ liệu.'}

---
💡 **Chiến lược can thiệp đề xuất:**
- Nhóm CRITICAL: Gọi điện trực tiếp, gửi mail phụ huynh ngay tuần này
- Nhóm HIGH: Lên kế hoạch phụ đạo và bổ trợ trong 2 tuần tới
- Các môn bottleneck: Xem xét tổ chức ôn tập, review bài lab`;

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
      const level = riskData.level;
      return {
        text: `💊 **PHƯƠNG ÁN CAN THIỆP HỌC VỤ (DSS ACTION CHECKLIST)**
👨‍🎓 Sinh viên: **${studentName}**
🚨 Mức độ: **${formatRiskBadge(level, riskData.riskScore)}**

**Hành động đề xuất cho Cố vấn học tập (CVHT):**
- [ ] 📞 Gọi điện trao đổi trực tiếp và gửi mail thông báo tình trạng
- [ ] 📚 Đăng ký lớp phụ đạo bổ trợ cho các môn nền tảng bị hổng
- [ ] 📝 Giao bài tập lab bù đắp kiến thức cơ bản từ tuần này
- [ ] 👁️ Theo dõi chuyên cần chặt chẽ trong 3 tuần tiếp theo
${level === 'CRITICAL' ? '- [ ] 🆘 Báo cáo Ban Giám hiệu và thông báo phụ huynh ngay lập tức' : ''}${chartStr}`,
        chartData: chartStr,
        actions: ['timeline', 'nguyên nhân']
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
      ? `🤔 Tôi chưa hiểu yêu cầu này. Bạn đang hỏi về sinh viên **${activeMssv}**. Bạn muốn xem:
→ *"nguyên nhân"* | *"chuyên cần"* | *"can thiệp"* | *"timeline"* | *"điểm mạnh"*`
      : `🤔 Tôi chưa hiểu yêu cầu. Hãy thử:
- Nhập **MSSV** (VD: *PS47261*) để phân tích sinh viên
- Hỏi *"tình hình lớp"* để xem class analytics
- Hỏi *"top nguy cơ"* để xem risk ranking
- Gõ *"help"* để xem hướng dẫn`,
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

    case 'RISK_RANKING':
      return buildClassAnalyticsResponse({ analytics: {
        total: decisionData.topAtRisk.length,
        criticals: decisionData.topAtRisk.filter(s => s.level === 'CRITICAL').length,
        highs: decisionData.topAtRisk.filter(s => s.level === 'HIGH').length,
        mediums: 0,
        lows: 0,
        topAtRisk: decisionData.topAtRisk,
        bottleneckSubjects: decisionData.bottleneck || [],
        distribution: decisionData.distribution
      }});

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
