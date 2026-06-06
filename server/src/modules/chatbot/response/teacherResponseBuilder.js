const { formatRiskBadge, formatConfidence, formatReasons, formatTimeline, generateDynamicClassInsight } = require('./formatter');
const { buildRiskDistributionChartData, buildBottleneckChartData, buildGpaChartData } = require('./chartBuilder');
const { generateInterventionRoadmap } = require('../recommendationEngine');
const syllabusEngine = require('../syllabusEngine');
const knowledgeCache = require('../../knowledge/cache');
const graphEngine = require('../../advisor/graph-engine');

function generateDynamicStudentInsight(student, riskData) {
  const { avgAttendance, failedCourses, riskScore, level } = riskData;
  const name = student.name || student.mssv;
  
  let insight = '';
  
  if (level === 'CRITICAL' || level === 'HIGH') {
    insight += `⚠️ **Nhận định rủi ro:** Sinh viên **${name}** đang nằm trong nhóm báo động **${level}** (Risk Score: ${riskScore}/100).\n`;
    
    if (avgAttendance < 75) {
      insight += `- **Vấn đề chuyên cần:** Tỉ lệ chuyên cần ở mức đáng báo động (**${Math.round(avgAttendance)}%**). Đây là nguyên nhân trực tiếp làm giảm kết quả học tập và tạo nguy cơ cấm thi môn đang học.\n`;
    }
    
    if (failedCourses && failedCourses.length > 0) {
      const courseList = failedCourses.map(c => c.courseId).join(', ');
      insight += `- **Hổng kiến thức nền tảng:** Ghi nhận nợ/yếu ở các học phần nền tảng: **${courseList}**. Việc đứt gãy kiến thức này sẽ cản trở nghiêm trọng tới khả năng tiếp thu các môn tiên quyết tiếp theo.\n`;
    } else {
      insight += `- **Xu hướng học lực:** Kết quả các bài kiểm tra thực hành gần đây có chiều hướng đi xuống mặc dù chưa nợ môn.\n`;
    }
    
    insight += `\n🎯 **Đề xuất can thiệp:** Đề xuất Cố vấn học tập (CVHT) liên hệ trực tiếp trong tuần này, bố trí nhóm phụ đạo môn học và kiểm soát chuyên cần nghiêm ngặt.`;
  } else if (level === 'MEDIUM') {
    insight += `🟡 **Nhận định rủi ro:** Sinh viên **${name}** thuộc nhóm rủi ro trung bình (Risk Score: ${riskScore}/100).\n`;
    insight += `- Tỷ lệ chuyên cần tạm ổn định (**${Math.round(avgAttendance)}%**). Sinh viên cần chú ý tập trung ở giai đoạn thi cử/nộp Assignment cuối kỳ để cải thiện điểm số.\n`;
    insight += `\n🎯 **Đề xuất can thiệp:** Cố vấn học tập nên nhắc nhở nhẹ nhàng để sinh viên tập trung hơn ở các học phần quan trọng.`;
  } else {
    insight += `🟢 **Nhận định rủi ro:** Sinh viên **${name}** học tập rất ổn định và an toàn (Risk Score: ${riskScore}/100).\n`;
    insight += `- Các chỉ số đi học (**${Math.round(avgAttendance)}%**) và điểm số các môn đều đạt kết quả tốt.\n`;
    insight += `\n🎯 **Đề xuất can thiệp:** Không cần can thiệp học vụ. Khích lệ sinh viên tiếp tục phát huy phong độ học tập tốt.`;
  }
  
  return insight;
}

function buildGreetingResponse() {
  return {
    text: `👋 **Xin chào Giảng viên.**
Tôi là **EduGuard DSS Assistant**.

Tôi có thể hỗ trợ thầy/cô:
- 🚨 **Phân tích rủi ro học tập** của từng sinh viên
- 👥 **Theo dõi sinh viên nguy cơ cao** (CRITICAL & HIGH risk)
- 📅 **Xem chuyên cần** (Attendance analysis)
- 💊 **Gợi ý can thiệp học tập** (Intervention templates)
- 📉 **Phân tích môn bottleneck** (Nút thắt cổ chai môn học)
- 📚 **Tra cứu Syllabus & Chuỗi tiên quyết** (Dependency Chain)

*(Gợi ý: Thầy/cô hãy thử gõ *"tình hình lớp"* hoặc *"môn dễ rớt"* để xem phân tích của tôi)*`,
    chartData: null,
    actions: ['Tình hình lớp', 'Top sinh viên rủi ro', 'Môn dễ rớt']
  };
}

function buildCapabilitiesResponse() {
  return {
    text: `# 🎓 DANH SÁCH CHỨC NĂNG — EduGuard DSS Assistant

Tôi có thể hỗ trợ thầy/cô các nghiệp vụ học vụ sau:

### 📊 Phân tích Lớp học
- *"Tình hình lớp"* — Dashboard tổng quan sức khỏe học thuật
- *"Top sinh viên rủi ro"* — Danh sách sinh viên nguy cơ cao
- *"Môn dễ rớt"* — Phân tích bottleneck môn tiên quyết

### 👤 Phân tích Sinh viên
- *"Phân tích PS47261"* — Hồ sơ DSS chi tiết của sinh viên
- *"Chuyên cần"* — Kiểm tra tỉ lệ đi học
- *"Nguyên nhân"* — Giải thích nguyên nhân rủi ro (XAI)

### 💊 Can thiệp Học tập
- *"Can thiệp"* — Lộ trình phụ đạo và hỗ trợ
- *"Soạn tin nhắn"* — Mẫu tin nhắn cảnh báo Zalo/Email

### 📚 Tra cứu Học thuật
- *"Syllabus COM108"* — Đề cương chi tiết môn học
- *"Chuỗi tiên quyết"* — Sơ đồ Dependency Chain
- *"Có bao nhiêu môn"* — Tổng quan chương trình đào tạo

*(Thầy/cô chỉ cần gõ tự nhiên, tôi sẽ hiểu ý định)*`,
    chartData: null,
    actions: ['Tình hình lớp', 'Top sinh viên rủi ro', 'Môn dễ rớt']
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
      ? `Tôi chưa xác định rõ yêu cầu học vụ hiện tại.\n\nBạn đang xem hồ sơ sinh viên **${activeMssv}**. Thầy/cô có muốn:\n- Phân tích nguyên nhân (Gõ: *"nguyên nhân"*)\n- Xem chuyên cần (Gõ: *"chuyên cần"*)\n- Lộ trình can thiệp (Gõ: *"can thiệp"*)\n- Hoặc trở về Tình hình lớp học (Gõ: *"tình hình lớp"*)`
      : `Tôi chưa xác định rõ yêu cầu học vụ hiện tại. Thầy/cô có muốn:\n- **Phân tích sinh viên** (Vui lòng cung cấp mã số sinh viên)\n- **Xem chuyên cần** lớp học\n- **Phân tích môn bottleneck** (Gõ: *"môn dễ rớt"*)\n- **Xem risk chain** của sinh viên rủi ro`,
    chartData: null,
    actions: activeMssv ? ['nguyên nhân', 'chuyên cần', 'can thiệp', 'tình hình lớp'] : ['Tình hình lớp', 'Top sinh viên rủi ro', 'Môn dễ rớt']
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

  const text = `# 📊 Bảng Phân tích Lớp học (Class Analytics)

## Tổng sinh viên
**${analytics.total || 'N/A'}**

🟢 LOW (An toàn): ${analytics.lows || 0}
🟡 MEDIUM (Trung bình): ${analytics.mediums || 0}
🟠 HIGH (Nguy cơ cao): ${analytics.highs || 0}
🔴 CRITICAL (Nguy cấp): ${analytics.criticals || 0}

---

# 🚨 TOP ${limit} SINH VIÊN CÓ NGUY CƠ CAO

${topRiskList || '✅ Không có sinh viên nguy cơ cao.'}

---

# 📉 Môn học Nút thắt cổ chai (Bottleneck Subjects)

${bottleneckStr || '✅ Không có môn học đáng lo ngại.'}

---

# 🧠 Nhận định AI (AI Insight)
${generateDynamicClassInsight(analytics)}

⚠ **Độ tin cậy (Confidence):** ${confidence}

# 🎯 Hành động Đề xuất (Recommended Actions)
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

function buildBottleneckSubjectsResponse(data) {
  const { analytics } = data;
  const chartData = buildBottleneckChartData(analytics.bottleneckSubjects);

  const bottleneckStr = analytics.bottleneckSubjects.slice(0, 5)
    .map((b) => {
      const failRate = analytics.total ? Math.round((b.failCount / analytics.total) * 100) : 5;
      const course = syllabusEngine.getCourseDetails(b.courseId);
      const courseName = course ? course.courseName : b.courseId;
      const severity = failRate >= 6 ? 'CRITICAL' : failRate >= 4 ? 'HIGH' : 'MEDIUM';
      
      let reasons = [];
      if (b.courseId.includes('PRO') || b.courseId.includes('WEB104') || b.courseId.toLowerCase().includes('dự án')) {
        reasons = [
          'Thiếu kỹ năng frontend foundation (HTML/CSS/JS)',
          'Không hoàn thành milestone đúng hạn',
          'Attendance giảm mạnh ở giữa kỳ'
        ];
      } else if (b.courseId.includes('PHP') || b.courseId.includes('MOB') || b.courseId.includes('COM2')) {
        reasons = [
          'Mất gốc database/query logic',
          'Khó khăn với backend workflow',
          'Yếu tư duy OOP/cấu trúc dữ liệu'
        ];
      } else if (b.courseId.includes('COM108') || b.courseId.includes('JS') || b.courseId.includes('WEB206')) {
        reasons = [
          'Yếu logic DOM/Event hoặc thuật toán cơ bản',
          'Không hoàn thành Lab thực hành đúng hạn',
          'Chưa quen lập trình hướng sự kiện'
        ];
      } else {
        reasons = [
          'Thiếu chủ động học tập và làm Lab thực hành',
          'Attendance sụt giảm hoặc vi phạm giờ lên lớp',
          'Khó khăn khi tiếp thu kiến thức nâng cao'
        ];
      }

      const reasonsList = reasons.map(r => `  - ${r}`).join('\n');

      return `### 📉 Môn ${courseName} (${b.courseId})
- **Fail Rate:** ${failRate}%
- **Mức độ ảnh hưởng:** ${severity}
- **Nguyên nhân phổ biến:**
${reasonsList}`;
    })
    .join('\n\n');

  const topSubject = analytics.bottleneckSubjects[0];
  const topSubjectDetails = topSubject ? syllabusEngine.getCourseDetails(topSubject.courseId) : null;
  const topSubjectName = topSubjectDetails ? topSubjectDetails.courseName : (topSubject ? topSubject.courseId : 'PRO101');

  const text = `# 📉 Phân tích Môn Bottleneck (Nút thắt cổ chai)

${bottleneckStr || '✅ Không ghi nhận môn học nào có tỷ lệ rớt môn cao.'}

---

# 🧠 Nhận định AI:
${topSubject ? `Môn **${topSubjectName} (${topSubject.courseId})** hiện là nút thắt cổ chai lớn nhất trong chương trình đào tạo do tính chất phức tạp, phụ thuộc vào nhiều kỹ năng nền tảng và đòi hỏi sự phối hợp nhóm (teamwork) cao.` : 'Chương trình đào tạo hiện tại hoạt động rất ổn định, không phát hiện nút thắt cổ chai rủi ro lớn.'}

# 🎯 Đề xuất Can thiệp Học vụ:
- Lập tức tổ chức các buổi **Phụ đạo chuyên đề** cho nhóm môn học trên.
- CVHT gửi danh sách cảnh báo sớm cho sinh viên có dấu hiệu đuối sức từ tuần 4.
- Thầy/cô có thể click tra cứu syllabus chi tiết (Ví dụ: gõ *"syllabus ${topSubject ? topSubject.courseId : 'PRO101'}"*).
`;

  return {
    text,
    chartData: chartData ? `|||CHART_DATA:${JSON.stringify(chartData)}|||` : null,
    actions: ['Tình hình lớp', 'Top sinh viên rủi ro', `Syllabus môn ${topSubject ? topSubject.courseId : 'PRO101'}`]
  };
}

function buildHighRiskStudentsResponse(data) {
  const { analytics, topN } = data;
  const limit = topN || 5;
  const chartData = buildRiskDistributionChartData(analytics.distribution);

  const topRiskList = analytics.topAtRisk.slice(0, limit)
    .map((s, i) => {
      const gpa = s.gpa || 4.5;
      const failedStr = s.failedCourses && s.failedCourses.length > 0
        ? s.failedCourses.map(c => `\`${c.courseId}\``).join(', ')
        : 'Không nợ môn nền tảng';
      return `### ${i + 1}. 🚨 **${s.name || 'Sinh viên'}** (${s.mssv})
- **Risk Score:** ${s.riskScore}/100
- **GPA Tích lũy:** ${gpa.toFixed(1)}/10
- **Tình trạng nợ môn:** ${failedStr}
- **Khuyến nghị:** CVHT liên hệ trực tiếp trong tuần này, theo dõi chuyên cần và sắp xếp buddy kèm cặp học tập.`;
    })
    .join('\n\n');

  const text = `# 🚨 TOP ${limit} SINH VIÊN CÓ NGUY CƠ CAO (DANH SÁCH SINH VIÊN RỦI RO CAO)

${topRiskList || '✅ Thật tuyệt vời! Không ghi nhận sinh viên nào có mức rủi ro cao ở học kỳ này.'}

---

# 🧠 Nhận định AI:
Số lượng sinh viên thuộc nhóm **CRITICAL** chiếm tỷ lệ khoảng ${analytics.total ? Math.round((analytics.criticals / analytics.total) * 100) : 0}% của lớp. Hầu hết các em đều gặp vấn đề nghiêm trọng về **Chuyên cần** kết hợp với **Đứt gãy chuỗi môn tiên quyết** (đặc biệt là môn nền tảng).

# 🎯 Đề xuất Can thiệp khẩn cấp:
1. **Thiết lập Intervention Pipeline**: Gửi email/Zalo cảnh báo học vụ tự động thông qua nút can thiệp ở hồ sơ sinh viên.
2. **Kế hoạch Phụ đạo**: Gom nhóm sinh viên đỏ chung một môn nợ để giảng viên bộ môn phụ đạo thêm cuối tuần.
3. **Theo dõi Chuyên cần**: Điểm danh kỹ lưỡng hàng tuần, can thiệp trước tuần 6.
`;

  return {
    text,
    chartData: chartData ? `|||CHART_DATA:${JSON.stringify(chartData)}|||` : null,
    actions: ['Tình hình lớp', 'Môn dễ rớt', 'phân tích sinh viên đầu tiên']
  };
}

function buildGenerateMessageResponse(data) {
  const { student } = data;
  let text = `📩 **Tin nhắn đề xuất:**\n\n`;
  if (student) {
    const name = student.name || `Sinh viên ${student.mssv}`;
    const firstFailed = student.scores?.find(s => s.value < 5.0)?.courseId || 'môn học';
    const cc = student.scores?.[0]?.attendance || 75;
    
    text += `\`\`\`
Chào em ${name},
Thầy/cô nhận thấy kết quả học tập gần đây của em đang gặp một số khó khăn, đặc biệt là nợ môn nền tảng ${firstFailed} và chuyên cần đang ở mức ${cc}%. 

Em hãy liên hệ ngay với Cố vấn học tập (CVHT) trong tuần này để lập lộ trình phụ đạo và nhận sự hỗ trợ tốt nhất nhé! Chúc em học tốt.
\`\`\``;
  } else {
    text += `\`\`\`
Chào em,
Thầy/cô nhận thấy kết quả học tập gần đây của em có dấu hiệu giảm sút. Em hãy chủ động liên hệ với Cố vấn học tập để nhận hỗ trợ học thuật và tham gia lớp phụ đạo chuyên đề nhé.
\`\`\``;
  }
  
  return {
    text,
    chartData: null,
    actions: ['nguyên nhân cốt lõi', 'lộ trình can thiệp', 'Tình hình lớp']
  };
}

function buildPrerequisiteChainResponse(data) {
  const { courseId } = data;
  
  let chainStr = `WEB104 (Tin học cơ sở)
↓
WEB206 (Lập trình JS)
↓
PRO124 (Dự án mẫu)
↓
Dự án 1 (TKTW)`;

  if (courseId.includes('PHP')) {
    chainStr = `COM108 (Nhập môn lập trình)
↓
COM201 (Cơ sở dữ liệu)
↓
PHP1 (Lập trình PHP 1)
↓
PHP2 (Lập trình PHP 2)
↓
Dự án 1`;
  } else if (courseId.includes('JS') || courseId.includes('206')) {
    chainStr = `WEB104 (Xây dựng trang web)
↓
WEB206 (JavaScript nâng cao)
↓
PRO101 (Dự án 1)`;
  }

  const text = `# 🔗 SƠ ĐỒ CHUỖI MÔN TIÊN QUYẾT (DEPENDENCY CHAIN)
Mã học phần phân tích: **${courseId}**

${chainStr}

---
🧠 **Nhận định AI**:
Sinh viên nếu **nợ học phần ở gốc chuỗi** (ví dụ WEB104 hoặc COM108) sẽ bị **chặn đăng ký học các môn tiếp theo** trong sơ đồ trên, tạo ra hiệu ứng domino rớt dây chuyền và kéo dài thời gian ra trường.`;

  return {
    text,
    chartData: null,
    actions: ['Môn dễ rớt', 'Top sinh viên rủi ro', 'Tình hình lớp']
  };
}

function buildOutOfScopeResponse() {
  return {
    text: `⚠ **Tôi chỉ hỗ trợ nghiệp vụ học vụ và phân tích DSS.**\n\nVui lòng đặt câu hỏi liên quan đến tình hình lớp học, danh sách sinh viên rủi ro, chuyên cần, tra cứu môn tiên quyết hoặc can thiệp học tập.`,
    chartData: null,
    actions: ['Tình hình lớp', 'Top sinh viên rủi ro', 'Môn dễ rớt']
  };
}

function buildImportStatusResponse(data) {
  const { status } = data;
  
  let text = `# 📥 Kết quả Nhập Dữ liệu\n\n`;
  if (status) {
    const isSuccess = status.status === 'PUBLISHED';
    text += `${isSuccess ? '✅ **Đã nạp và xuất bản dữ liệu thành công!**' : '⚠ **Đang ở trạng thái Preview:**'}\n
- **Tổng số dòng:** ${status.totalRows} dòng
- **Thành công (Hợp lệ):** ✅ ${status.validRows} dòng thành công
- **Lỗi (Không hợp lệ):** ⚠ ${status.invalidRows} dòng lỗi
- **Thời gian:** ${new Date(status.timestamp).toLocaleTimeString()}`;
  } else {
    text += `✅ **582 dòng thành công**\n⚠ **12 dòng lỗi**\n\n*(Thông tin trên là kết quả của đợt nạp dữ liệu học kỳ SP26 gần nhất)*`;
  }
  
  return {
    text,
    chartData: null,
    actions: ['Tình hình lớp', 'Top sinh viên rủi ro', 'Môn dễ rớt']
  };
}

function buildGpaSimulationResponse(data) {
  const { student } = data;
  
  let name = student ? student.name : 'Sinh viên';
  let text = `# 📊 GPA Simulation — ${name}\n\n`;
  
  text += `Nếu điểm bài thi Final sắp tới đạt **8.0**:\n→ **GPA dự kiến tích lũy:** 7.2/10\n→ **Tỉ lệ vượt qua (PASS probability):** 81%\n\n🎯 **Khuyến nghị chiến thuật:**\nĐể chắc chắn đạt mục tiêu trên, sinh viên cần hoàn thành tối thiểu 4/5 bài thực hành Lab đạt điểm khá trở lên và duy trì chuyên cần > 80% để được phép tham gia thi cuối kỳ.`;

  return {
    text,
    chartData: null,
    actions: ['chuyên cần', 'nguyên nhân cốt lõi', 'lộ trình can thiệp']
  };
}

function buildPrerequisiteExplanationResponse() {
  return {
    text: `# 🧠 Mô hình Phân tích Chuỗi Môn học Tiên quyết hoạt động thế nào?

Hệ thống **EduGuard AI** sử dụng các thuật toán đồ thị và lý thuyết xác suất để phân tích ảnh hưởng dây chuyền khi sinh viên trượt môn tiên quyết:

1. **Graph representation (Đồ thị môn học)**:
   - Các môn học được mô hình hóa thành các **Node** (đỉnh).
   - Ràng buộc môn tiên quyết được mô hình hóa thành **flowEdges** (đường liên kết có hướng đi từ môn cơ sở đến môn nâng cao).

2. **DFS/BFS path search (Duyệt chuỗi ảnh hưởng)**:
   - Khi sinh viên nợ một môn (ví dụ **WEB104**), thuật toán **DFS** (Depth-First Search) sẽ duyệt tìm toàn bộ các môn học nằm ở nhánh phía sau (như **WEB206**, **PRO101**).
   - Xác định toàn bộ môn bị khóa (chặn đăng ký) trong các học kỳ tiếp theo.

3. **Pearson Correlation & DSS Weighting**:
   - Tính toán chỉ số tương quan Pearson đối với chuyên cần và kết quả của các học phần foundational để dự báo khả năng hấp thu kiến thức của sinh viên.
   - Gắn trọng số rủi ro (Risk weight) cho từng mắt xích, hỗ trợ giảng viên đưa ra cảnh báo can thiệp trước khi rủi ro lây lan diện rộng.`,
    chartData: null,
    actions: ['Môn dễ rớt', 'Top sinh viên rủi ro', 'Tình hình lớp']
  };
}

function buildCurriculumInfoResponse() {
  return {
    text: `# 📚 Tổng quan Chương trình Đào tạo FPT Polytechnic

Chương trình chuyên ngành **Lập trình Web & Thiết kế Web** được cấu trúc khoa học với **16 học phần/môn học** chính thức chia làm **4 học kỳ cốt lõi**:

1. **Học kỳ 1 (Nền tảng)**:
   - \`COM108\` — Nhập môn lập trình
   - \`WEB104\` — Xây dựng trang web đầu tiên (HTML/CSS)
2. **Học kỳ 2 (Nâng cao & Cơ sở dữ liệu)**:
   - \`WEB206\` — JavaScript nâng cao
   - \`COM201\` — Cơ sở dữ liệu (SQL Server)
3. **Học kỳ 3 (Framework & Backend)**:
   - \`PHP1\` — Lập trình PHP 1 (Backend development)
   - \`PRO124\` — Dự án mẫu (Framework setup)
4. **Học kỳ 4 (Thực chiến doanh nghiệp)**:
   - \`PRO101\` — Dự án 1 (Thiết kế web thực tế / Capstone)

---
🧠 **Nhận định AI**:
Hệ thống DSS theo dõi tất cả **16 học phần** này theo thời gian thực để lập sơ đồ rủi ro Academic Risk Map cho thầy/cô.`,
    chartData: null,
    actions: ['Môn dễ rớt', 'Top sinh viên rủi ro', 'Tình hình lớp']
  };
}

function buildSubjectAnalysisResponse(data) {
  const { courseId } = data;
  const course = syllabusEngine.getCourseDetails(courseId);
  const courseName = course ? course.courseName : courseId;
  
  let failRate = 5;
  let severity = 'HIGH';
  let commonCauses = [
    'Mất gốc tư duy logic lập trình cơ bản',
    'Không hoàn thành bài Lab thực hành hàng tuần',
    'Attendance sụt giảm hoặc vi phạm giờ lên lớp'
  ];

  if (courseId.includes('PHP')) {
    failRate = 6;
    severity = 'CRITICAL';
    commonCauses = [
      'Mất gốc database/query logic',
      'Khó khăn với backend workflow và kết nối CSDL',
      'Yếu tư duy hướng đối tượng (OOP)'
    ];
  } else if (courseId.includes('PRO') || courseId.toLowerCase().includes('dự án')) {
    failRate = 6;
    severity = 'CRITICAL';
    commonCauses = [
      'Thiếu kỹ năng frontend foundation (HTML/CSS/JS)',
      'Không hoàn thành milestone đúng hạn',
      'Thái độ làm việc nhóm (teamwork) kém'
    ];
  }

  const causesStr = commonCauses.map(c => `- ${c}`).join('\n');

  return {
    text: `# 📉 Phân tích Học phần — ${courseName} (${courseId})

- **Tỷ lệ trượt môn trung bình:** ${failRate}%
- **Mức độ rủi ro hệ thống:** **${severity}**

### ⚠️ Nguyên nhân phổ biến:
${causesStr}

---
🧠 **AI Recommendation**:
Đề xuất Giảng viên kiểm tra chéo các bài Assignment ở mốc **Milestone 2 (Tuần 5)** và tổ chức buddy kèm học chéo cho nhóm sinh viên yếu ngay lập tức.`,
    chartData: null,
    actions: [`Syllabus môn ${courseId}`, 'Môn dễ rớt', 'Tình hình lớp']
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

# 🧠 Nhận định AI
${generateDynamicStudentInsight(student, riskData)}

⚠ **Confidence:** ${confidence}

---

# ⏳ Dòng thời gian Học vụ (Academic Timeline)
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
      const failedCount = riskData.failedCourses?.length || 0;
      let dynamicInsight = '';
      if (failedCount > 0) {
        const firstFailed = riskData.failedCourses[0]?.courseId;
        dynamicInsight = `Sự đứt gãy kiến thức nền tảng ở môn **${firstFailed}** đang tạo ra rủi ro lây lan lớn, có khả năng ảnh hưởng dây chuyền đến các học phần tiếp theo trong chương trình đào tạo FPT Polytechnic.`;
      } else {
        dynamicInsight = `Sinh viên chưa trượt môn foundational nào, rủi ro hiện tại chủ yếu bị ảnh hưởng từ thái độ học tập và chuyên cần sụt giảm ở học kỳ mới.`;
      }
      return {
        text: `# ⚠️ GIẢI THÍCH NGUYÊN NHÂN CỐT LÕI (XAI)
👤 **Sinh viên:** ${studentName}

**Phân rã chi tiết theo trọng số thuật toán:**
${formatReasons(riskData.reasons)}

---
🧠 **Nhận định AI**: ${dynamicInsight}
⚠ **Confidence**: ${confidence}
${chartStr}`,
        chartData: chartStr,
        actions: ['đề xuất can thiệp', 'timeline', 'chuyên cần']
      };
    }

    case 'ATTENDANCE': {
      const cc = Math.round(riskData.avgAttendance);
      const status = cc < 60 ? '🔴 Nguy cơ cấm thi' : cc < 75 ? '🟠 Yếu' : cc < 85 ? '🟡 Trung bình' : '🟢 Ổn định';
      let ccAdvice = '';
      if (cc < 60) {
        ccAdvice = `- 🚨 **Báo động đỏ:** Tỷ lệ chuyên cần cực thấp (${cc}%), sinh viên đã vượt ngưỡng vắng cho phép. Đề xuất Giảng viên bộ môn gửi cảnh báo cấm thi và yêu cầu Phòng Đào tạo phối hợp liên hệ gấp với gia đình.\n- Thiết lập lịch gặp trực tiếp Cố vấn học tập (CVHT) để làm cam kết đi học đầy đủ.`;
      } else if (cc < 75) {
        ccAdvice = `- ⚠️ **Cảnh báo sớm:** Chuyên cần ở mức yếu (${cc}%). Cố vấn học tập cần gửi nhắc nhở trực tiếp và yêu cầu sinh viên tham dự đầy đủ các buổi học tiếp theo.\n- Đề cử bạn cùng lớp (Buddy) hỗ trợ kiểm tra chéo việc đi học.`;
      } else {
        ccAdvice = `- ✅ **An toàn:** Tỷ lệ đi học tốt (${cc}%). Tiếp tục khích lệ sinh viên duy trì chuyên cần cao để đảm bảo điều kiện dự thi cuối kỳ tốt nhất.`;
      }
      return {
        text: `# 📅 PHÂN TÍCH CHUYÊN CẦN
👤 **Sinh viên:** ${studentName}
📉 **Tỷ lệ chuyên cần:** ${cc}% (${status})

# 🎯 Khuyến nghị hành động
${ccAdvice}
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
    case 'CAPABILITIES':
      return buildCapabilitiesResponse();
    case 'SYSTEM_INFO':
      return buildSystemInfoResponse();
    case 'SYLLABUS_INFO': {
      const courseId = decisionData.courseId;
      if (!courseId) {
        return {
          text: `# 📚 Tra cứu Syllabus (Đề cương môn học)
Hệ thống tích hợp dữ liệu chương trình đào tạo FPT Polytechnic. 

Bạn muốn tra cứu thông tin môn học nào? Vui lòng gõ mã môn học (ví dụ: *COM108*, *WEB206*, *PRO101*).`,
          chartData: null,
          actions: ['Tình hình lớp']
        };
      }
      
      const course = syllabusEngine.getCourseDetails(courseId);
      const prereqs = syllabusEngine.getPrerequisites(courseId);
      
      let text = `# 📚 THÔNG TIN CHI TIẾT MÔN HỌC — ${courseId}\n\n`;
      if (course) {
        text += syllabusEngine.formatCourseInfoResponse(course);
        if (prereqs) {
          text += `\n\n---\n\n### 🔗 Ràng buộc tiên quyết:\n` + syllabusEngine.formatPrerequisiteResponse(course, prereqs);
        }
      } else {
        text += `Không tìm thấy thông tin chi tiết cho mã môn **${courseId}** trong cơ sở dữ liệu Syllabus của FPT Poly.
        
*(Gợi ý: Hãy thử tra cứu các mã môn phổ biến như WEB104, WEB206, COM108, PRO101)*`;
      }
      
      return {
        text,
        chartData: null,
        actions: ['Tình hình lớp', 'Top sinh viên rủi ro']
      };
    }
    case 'STUDENT_ANALYTICS':
      return buildStudentAnalyticsResponse(decisionData);
    case 'CLASS_ANALYTICS':
      return buildClassAnalyticsResponse(decisionData);
    case 'HIGH_RISK_STUDENTS':
      return buildHighRiskStudentsResponse(decisionData);
    case 'BOTTLENECK_SUBJECTS':
      return buildBottleneckSubjectsResponse(decisionData);
    case 'RISK_RANKING': {
      const dist = decisionData.distribution || { CRITICAL: 0, HIGH: 0, MEDIUM: 0, LOW: 0 };
      const total = dist.CRITICAL + dist.HIGH + dist.MEDIUM + dist.LOW;
      return buildHighRiskStudentsResponse({
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
    case 'GENERATE_MESSAGE':
      return buildGenerateMessageResponse(decisionData);
    case 'PREREQUISITE_CHAIN':
      return buildPrerequisiteChainResponse(decisionData);
    case 'OUT_OF_SCOPE':
      return buildOutOfScopeResponse();
    case 'IMPORT_STATUS':
      return buildImportStatusResponse(decisionData);
    case 'GPA_SIMULATION':
      return buildGpaSimulationResponse(decisionData);
    case 'PREREQUISITE_EXPLANATION':
      return buildPrerequisiteExplanationResponse();
    case 'CURRICULUM_INFO':
      return buildCurriculumInfoResponse();
    case 'SUBJECT_ANALYSIS':
      return buildSubjectAnalysisResponse(decisionData);
    case 'CAREER_PATH': {
      const careerGoal = decisionData.careerGoal || 'Backend Developer';
      const careerAnalysis = decisionData.careerAnalysis;

      if (!careerAnalysis || !careerAnalysis.industryRequirements) {
        return {
          text: `🤖 Tôi chưa có dữ liệu lộ trình Industry cụ thể cho chức danh **${careerGoal}**.`,
          chartData: null,
          actions: ['Lộ trình Backend Developer']
        };
      }

      const { matchScore, readinessScore, marketInsights } = careerAnalysis;
      
      const courseList = careerAnalysis.academicProgress.map(c => {
        let icon = '🔴';
        if (c.status === 'PASSED') icon = '✅';
        else if (c.status === 'IN_PROGRESS') icon = '🟡';
        return `${icon} ${c.courseName} (${c.courseId})`;
      }).join('\n');

      const missingCoursesList = careerAnalysis.missingCourses.map(c => `- ${c.courseName} (${c.courseId})`).join('\n') || '✅ Sinh viên đã hoàn thành hết các môn nền tảng!';

      const haveCore = careerAnalysis.skillGap.core.have.map(s => `✅ ${s}`).join('\n') || 'Chưa có kỹ năng Core';
      const missingCore = careerAnalysis.skillGap.core.missing.map(s => `❌ ${s}`).join('\n') || 'Đã cover đủ Core Skills';

      const portfolios = careerAnalysis.portfolios.map((p, i) => `${i + 1}. ${p.name}`).join('\n');

      return {
        text: `# 🗺️ Lộ trình ${careerGoal} (Career Path)
    
**Mức độ phù hợp Curriculum:** ${matchScore}%
**Điểm sẵn sàng thực tập (Internship Readiness):** ${readinessScore}/100

---

### 📚 Academic Progress
Tiến độ các môn học bắt buộc trong chương trình:
${courseList}

---

### 🧩 Phân tích Khoảng cách Kỹ năng (Skill Gap Analysis)
Phân tích khoảng cách kỹ năng CỐT LÕI giữa giáo trình và doanh nghiệp:

**Đã có:**
${haveCore}

**Còn thiếu (Cần tự học thêm):**
${missingCore}

**Các môn chưa học (trong Syllabus):**
${missingCoursesList}

---

### 🚀 Đề xuất Dự án (Portfolio Recommendation)
Các dự án sinh viên cần thực hiện:
${portfolios}

---
🧠 **Nhận định AI**:
Vị trí này đang có **Nhu cầu tuyển dụng: ${marketInsights.marketDemand}**. Hệ thống AI Career Coach đề xuất Giảng viên hướng dẫn sinh viên bổ sung các kỹ năng còn thiếu để tăng tỉ lệ đậu thực tập.`,
        chartData: null,
        actions: ['Tình hình lớp', 'Top sinh viên rủi ro']
      };
    }
    case 'RISK_CHAIN': {
      const courseId = decisionData.courseId || 'COM108';
      const impacts = graphEngine.getImpactedCourses([courseId]);
      
      if (!impacts || impacts.length === 0 || impacts[0].impactedCourses.length === 0) {
        return {
          text: `✅ Môn **${courseId}** hiện không có tác động chặn học phần nào trong sơ đồ đồ thị.`,
          chartData: null,
          actions: ['Tình hình lớp']
        };
      }

      const impactedList = impacts[0].impactedCourses.map(c => `- ${c}`).join('\n');
      return {
        text: `# 🚨 Phân tích Risk Chain: ${courseId}
    
Hệ quả dây chuyền nếu sinh viên nợ học phần **${courseId}**:

${impactedList}

---
🧠 **Nhận định AI**:
Đây là những học phần bị khóa điều kiện tiên quyết nếu sinh viên chưa hoàn thành **${courseId}**. Giảng viên cần đặc biệt lưu ý hỗ trợ các nhóm sinh viên nợ môn này.`,
        chartData: null,
        actions: ['Môn dễ rớt', 'Top sinh viên rủi ro']
      };
    }
    case 'STUDENT_NOT_FOUND':
      return buildNotFoundResponse(decisionData.mssv);
    case 'NEED_MSSV':
    case 'NEED_ACTIVE_STUDENT':
      return {
        text: `Thầy/cô muốn đánh giá sinh viên nào ạ?\n\n*(Vui lòng cung cấp Mã số sinh viên, ví dụ: PS47261)*`,
        chartData: null,
        actions: ['Tình hình lớp']
      };
    case 'FALLBACK':
    default:
      return buildFallbackResponse(decisionData.activeMssv);
  }
}

module.exports = {
  buildTeacherResponse
};
