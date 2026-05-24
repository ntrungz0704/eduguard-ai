const fs = require('fs');

const predictFile = 'client/src/pages/Predict.jsx';
let content = fs.readFileSync(predictFile, 'utf8');

content = content.replace(/Độ chính xác \(Accuracy\)/g, 'Độ tin cậy (Confidence)');
content = content.replace(/Độ chính xác AI:/g, 'Độ tin cậy hệ thống:');
content = content.replace(/dự báo chính xác/g, 'phân tích chính xác');
content = content.replace(/Dự báo điểm rủi ro qua AI/g, 'Sàng lọc nguy cơ rớt môn (Academic Warning)');
content = content.replace(/Thuật toán AI tự động quét/g, 'Hệ thống tự động phân tích');
content = content.replace(/Dự Đoán Học Vụ Bằng Trí Tuệ Nhân Tạo/g, 'Hệ Thống Phân Tích Học Vụ & Cảnh Báo Sớm');

// Add disclaimer at the top of Predict table
const disclaimerTarget = `<div className="mt-8 flex justify-end gap-3">`;
const disclaimerReplacement = `<div className="mt-8 bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl">
            <div className="flex items-start gap-3">
              <span className="text-amber-400 mt-0.5">⚠️</span>
              <div>
                <h4 className="text-sm font-bold text-amber-400 mb-1">Lưu ý từ Hệ thống</h4>
                <p className="text-xs text-amber-400/80 leading-relaxed">
                  Hệ thống hỗ trợ phát hiện sớm dựa trên chuỗi liên kết 34 môn học. Kết quả mang tính tham khảo cho Cố vấn học tập, giúp ưu tiên can thiệp kịp thời và <strong>không thay thế quyết định của giảng viên</strong>.
                </p>
              </div>
            </div>
          </div>\n          <div className="mt-4 flex justify-end gap-3">`;

content = content.replace(disclaimerTarget, disclaimerReplacement);

fs.writeFileSync(predictFile, content, 'utf8');
console.log('Fixed Predict disclaimer and terminology');
