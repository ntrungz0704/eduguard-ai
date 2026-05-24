const fs = require('fs');

const dashboardFile = 'client/src/pages/Dashboard.jsx';
let content = fs.readFileSync(dashboardFile, 'utf8');

// Ensure that "34 môn học" is highlighted.
content = content.replace("Trực tiếp giám sát sức khỏe học thuật của hệ thống sinh viên.", "Trực tiếp giám sát sức khỏe học thuật dựa trên phân tích chuỗi liên kết 34 môn học.");
content = content.replace("Báo cáo nguy cơ trượt môn", "Báo cáo gãy chuỗi môn tiên quyết");
content = content.replace("Bản Đồ Phân Bổ Nguy Cơ Rớt Môn Hiện Tại", "Phân Bổ Nguy Cơ Gãy Chuỗi Theo 34 Môn Học");
content = content.replace("Dự báo môn học có số lượng sinh viên rớt cao nhất trong tuần tới.", "Các môn chuyên ngành có số lượng sinh viên hụt kiến thức nền tảng cao nhất.");

fs.writeFileSync(dashboardFile, content, 'utf8');
console.log('Updated Dashboard.jsx');
