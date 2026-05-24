const fs = require('fs');

const apiFile = 'server/legacy/routes/api.js';
let content = fs.readFileSync(apiFile, 'utf8');

// 1. Rewrite GREETING
content = content.replace(
  "return `👋 Xin chào! Tôi là trợ lý NLP của EduGuard AI.\\nTôi có thể hỗ trợ phân tích rủi ro học thuật, tư vấn lộ trình và thống kê điểm số. Bạn hãy cung cấp mã số sinh viên hoặc đặt câu hỏi nhé!`;",
  "return `👋 Xin chào! Mình là Trợ lý Học vụ EduGuard.\\nMình có thể giúp bạn theo dõi chuỗi liên kết 34 môn học, phân tích nguy cơ đứt gãy kiến thức và đề xuất hướng can thiệp cho sinh viên.\\n\\nBạn muốn mình phân tích một sinh viên cụ thể hay xem thống kê toàn hệ thống?`;"
);

// 2. Rewrite SYSTEM_INFO
content = content.replace(
  "return `⚙️ THÔNG TIN HỆ THỐNG EDUGUARD AI\\n\\nTôi là EduGuard AI - Nền tảng Phân tích Học vụ & Cảnh báo Sớm.\\n• **Kiến trúc**: Chạy 100% Offline Local với mô hình NLP và Regression AI.\\n• **Tính năng chính**: Phân tích rủi ro trượt môn, Xây dựng lộ trình cải thiện điểm số, Trích xuất danh sách sinh viên nguy cơ.\\n• **Thuật toán**: Sử dụng Sơ đồ phân tích chuỗi học vụ 34 môn (Dependency Graph) để tìm ra nguồn gốc lỗ hổng kiến thức và dự báo rủi ro.\\n\\nBạn có thể hỏi tôi về bất kỳ sinh viên nào (VD: \"Phân tích PS47261\") hoặc xem bảng xếp hạng môn học nguy hiểm.`;",
  "return `🎓 EduGuard AI hiện có thể hỗ trợ:\\n\\n• Phát hiện sinh viên có nguy cơ học lực yếu\\n• Theo dõi chuỗi liên kết 34 môn học\\n• Phân tích môn nền tảng bị hổng\\n• Gợi ý hướng can thiệp học tập\\n• Thống kê lớp học và học phần nguy cơ cao`;"
);

// 3. Update the Scope Detection and noMssvRequired logic in the Express endpoint
// Find the logic around line 1475:
const noMssvRequiredSearch = `    // Priority 2: Intent Priority (General/System/Greeting intents do not require MSSV)
    const noMssvRequired = intent === 'query.system_info' || intent === 'query.statistics' || intent === 'greeting' || intent === 'None';`;

const noMssvRequiredReplace = `    // Priority 2: Scope Detection & Intent Classification
    const systemKeywords = ["thống kê", "bao nhiêu", "môn nào", "danh sách", "nguy cơ cao", "top", "trượt nhiều nhất", "hệ thống"];
    const isSystemScope = systemKeywords.some(kw => message.toLowerCase().includes(kw)) || intent === 'query.system_info' || intent === 'query.statistics';
    const isGreeting = intent === 'greeting' || message.toLowerCase().trim() === 'hello' || message.toLowerCase().trim() === 'chào';
    
    const noMssvRequired = isSystemScope || isGreeting;`;

content = content.replace(noMssvRequiredSearch, noMssvRequiredReplace);

// 4. Update the Missing Student check in the express endpoint to NOT block system queries
const expressBlockSearch = `    if (!activeMssv && !noMssvRequired) {
      // Still allow if LLM can handle it, but for our local system we might fail
    }`;

// Wait, looking at the previous file view, let me check how it blocks.
// Actually, `api.js` has `if (!student)` inside `smartLocalReply`!
const smartLocalReplyCheckSearch = `    // D. YÊU CẦU DỮ LIỆU
    if (!student) {
      return \`👋 Chào bạn! Bạn muốn tôi phân tích dữ liệu học tập của sinh viên nào?\\n(Ví dụ: Gõ **PS47261** hoặc chọn từ danh sách)\`;
    }`;

const smartLocalReplyCheckReplace = `    // D. SYSTEM SCOPE DETECTION (No Student Needed)
    const systemKeywords = ["thống kê", "bao nhiêu", "môn nào", "danh sách", "nguy cơ cao", "top", "trượt nhiều nhất"];
    const isSystemScope = systemKeywords.some(kw => msg.includes(kw));
    
    if (isSystemScope) {
      // Provide a generic system response if specific logic doesn't catch it
      const totalStudents = await prisma.student.count();
      return \`📈 THỐNG KÊ HỆ THỐNG\\n\\nHệ thống đang giám sát \${totalStudents} sinh viên qua chuỗi 34 môn học.\\n💡 Gợi ý: Bạn có thể hỏi "Top môn dễ trượt nhất là gì?" hoặc xem chi tiết một sinh viên (VD: PS47261).\`;
    }

    // E. YÊU CẦU DỮ LIỆU (For Student Scope)
    if (!student) {
      return \`Mình chưa biết bạn muốn phân tích sinh viên nào 😊\\n\\nBạn có thể:\\n• Nhập MSSV (VD: PS47261)\\n• Hoặc chọn sinh viên từ danh sách bên trái\`;
    }`;

content = content.replace(smartLocalReplyCheckSearch, smartLocalReplyCheckReplace);

fs.writeFileSync(apiFile, content, 'utf8');
console.log('Updated api.js with 4-tier Intent Routing');
