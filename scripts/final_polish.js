const fs = require('fs');

const filesToUpdate = [
  'client/src/App.jsx',
  'client/src/pages/AIChat.jsx',
  'client/src/pages/Predict.jsx'
];

filesToUpdate.forEach(file => {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    
    // App.jsx
    content = content.replace('Powered by Pearson & Regression Model', 'Powered by Academic Dependency Engine');

    // AIChat.jsx
    content = content.replace('Chi tiết công thức toán thuật toán Pearson dự đoán học thuật?', 'Mô hình phân tích chuỗi môn học tiên quyết hoạt động như thế nào?');
    content = content.replace('📐 Thuật toán Pearson', '📐 Knowledge Graph');

    // Predict.jsx
    content = content.replace('EduGuard AI sẽ phân tích các môn tiên quyết có hệ số tương quan (Pearson r) cao nhất để tính toán điểm rủi ro.', 'EduGuard AI sẽ phân tích mức độ hụt kiến thức của các môn học nền tảng để tính toán nguy cơ rớt môn chuyên ngành.');
    content = content.replace('Bản Đồ Hệ Số Tương Quan Học Thuật (Pearson Matrix)', 'Bản Đồ Liên Kết Môn Tiên Quyết (Dependency Graph)');
    content = content.replace('Hệ số Pearson (r) chỉ ra mức độ liên kết học vụ giữa các học phần trong FPT Polytechnic.', 'Sơ đồ chỉ ra mức độ liên kết học vụ giữa các học phần nền tảng và chuyên ngành trong chương trình 34 môn.');
    content = content.replace('Hệ số tương quan tuyến tính Pearson (r)', 'Mức độ ảnh hưởng dây chuyền');
    content = content.replace('r = {f.r}', 'Impact: {f.r > 0.5 ? "Mạnh" : "Vừa"}');
    content = content.replace('Mô hình học máy hiện chưa có đủ số lượng mẫu sinh viên để xây dựng hồi quy tuyến tính', 'Hệ thống hiện chưa có đủ số lượng sinh viên học qua chuỗi môn này để phân tích chuỗi rủi ro');
    content = content.replace('mô hình HK-Pearson', 'Academic Dependency Engine');
    content = content.replace('pearsonLoading', 'graphLoading');
    content = content.replace('setPearsonLoading', 'setGraphLoading');
    content = content.replace('pearsonData', 'graphData');
    content = content.replace('setPearsonData', 'setGraphData');
    content = content.replace('pearsonFilter', 'graphFilter');
    content = content.replace('setPearsonFilter', 'setGraphFilter');
    content = content.replace('fetchPearsonMatrix', 'fetchDependencyGraph');
    content = content.replace('/pearson-matrix', '/pearson-matrix'); // Keep API endpoint same to avoid backend break
    content = content.replace('Không thể tải dữ liệu ma trận Pearson', 'Không thể tải sơ đồ liên kết môn học');
    content = content.replace('Đang tính toán hệ số tương quan học bạ', 'Đang phân tích chuỗi liên kết 34 môn học');
    
    fs.writeFileSync(file, content, 'utf8');
    console.log('Updated: ' + file);
  }
});
