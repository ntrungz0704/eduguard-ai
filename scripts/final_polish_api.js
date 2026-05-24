const fs = require('fs');

const apiFile = 'server/legacy/routes/api.js';
let content = fs.readFileSync(apiFile, 'utf8');

// Replace chatbot "YÊU CẦU DỮ LIỆU"
content = content.replace(
  "return `🔍 YÊU CẦU DỮ LIỆU\\n\\nTôi chưa nhận diện được bạn muốn phân tích cho sinh viên nào. Vui lòng chọn một sinh viên từ thanh tìm kiếm hoặc gõ trực tiếp mã số (VD: PS47261) nhé!`;",
  "return `👋 Chào bạn! Bạn muốn tôi phân tích dữ liệu học tập của sinh viên nào?\\n(Ví dụ: Gõ **PS47261** hoặc chọn từ danh sách)`;"
);

// Add "34 subjects" logic to system prompt instruction
const promptSearch = `Bạn có toàn quyền truy cập số liệu thực tế này. Hãy tự tin giải thích và liệt kê rõ ràng tên các môn học hàng đầu có tỷ lệ trượt cao nhất kèm theo phần trăm cụ thể của chúng để làm nổi bật năng lực phân tích học tập của hệ thống EduGuard AI!\`);`;

const promptReplace = `Bạn có toàn quyền truy cập số liệu thực tế này. Hãy tự tin giải thích và liệt kê rõ ràng tên các môn học hàng đầu có tỷ lệ trượt cao nhất kèm theo phần trăm cụ thể của chúng.
ĐẶC BIỆT LƯU Ý KHI TRẢ LỜI: Hệ thống theo dõi chương trình đào tạo gồm 34 môn học. Bất kỳ rủi ro nào cũng xuất phát từ việc sinh viên bị hổng kiến thức ở các môn học nền tảng (Ví dụ: Yếu C++ dẫn tới rớt Java, yếu JS dẫn tới rớt React/Backend). Luôn giải thích rủi ro dựa trên chuỗi liên kết môn học, tuyệt đối không dùng các thuật ngữ toán học như Pearson, Tensorflow.\`);`;

content = content.replace(promptSearch, promptReplace);

// Also replace the fallback comment in api.js
content = content.replace("mô hình HK-Pearson (TensorFlow.js) để dự báo dựa trên chuỗi thành tích cá nhân và độ khó học phần.", "Sơ đồ Kiến thức Liên kết (Dependency Graph) dựa trên lộ trình 34 môn học để phát hiện gốc rễ rủi ro từ sớm.");
content = content.replace("Sử dụng HK-Pearson Weighted Regression (TensorFlow.js) để dự báo dựa trên chuỗi thành tích cá nhân và độ khó học phần.", "Sử dụng Sơ đồ phân tích chuỗi học vụ 34 môn (Dependency Graph) để tìm ra nguồn gốc lỗ hổng kiến thức và dự báo rủi ro.");

fs.writeFileSync(apiFile, content, 'utf8');
console.log('Updated api.js');
