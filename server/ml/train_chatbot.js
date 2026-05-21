const { NlpManager } = require('node-nlp');
const fs = require('fs');
const path = require('path');

console.log("============================================================");
console.log("🤖 EDUGUARD AI - LOCAL CHATBOT NLP TRAINING MODULE");
console.log("============================================================");

// Initialize NLP Manager for Vietnamese (or multi-language fallback to 'vi')
// Since node-nlp might have limited 'vi' tokenizer, 'vi' or 'en' (treated as generic) is used
const manager = new NlpManager({ languages: ['vi', 'en'], forceNER: true, autoSave: false });

// ============================================================
// 1. DẠY INTENT: HỎI TỔNG QUAN VỀ HỆ THỐNG
// ============================================================
manager.addDocument('vi', 'EduGuard là gì', 'ask.intro');
manager.addDocument('vi', 'hệ thống này làm được gì', 'ask.intro');
manager.addDocument('vi', 'giới thiệu về phần mềm', 'ask.intro');
manager.addDocument('vi', 'phần mềm này có tác dụng gì', 'ask.intro');
manager.addDocument('vi', 'có những tính năng nào', 'ask.features');
manager.addDocument('vi', 'chức năng chính của hệ thống', 'ask.features');
manager.addDocument('vi', 'EduGuard có gì hay', 'ask.features');

manager.addAnswer('vi', 'ask.intro', 'EduGuard AI là hệ thống Cảnh báo sớm và Can thiệp học vụ tự động. Hệ thống giúp dự đoán sinh viên có nguy cơ rớt môn dựa trên điểm các môn tiên quyết trong quá khứ để giảng viên kịp thời hỗ trợ.');
manager.addAnswer('vi', 'ask.features', 'Hệ thống có 3 tính năng chính: 1. Cảnh báo Đỏ (Dự đoán rớt môn sớm bằng AI). 2. Quản lý Can thiệp (Theo dõi và gửi lộ trình khắc phục cho sinh viên). 3. Trợ lý ảo AI 24/7 (Chatbot tư vấn học tập).');

// ============================================================
// 2. DẠY INTENT: HỎI VỀ THUẬT TOÁN (MACHINE LEARNING)
// ============================================================
manager.addDocument('vi', 'thuật toán là gì', 'ask.algorithm');
manager.addDocument('vi', 'hệ thống dùng thuật toán nào', 'ask.algorithm');
manager.addDocument('vi', 'mô hình AI nào được sử dụng', 'ask.algorithm');
manager.addDocument('vi', 'pearson là gì', 'ask.pearson');
manager.addDocument('vi', 'hệ số pearson tính thế nào', 'ask.pearson');
manager.addDocument('vi', 'tại sao lại dùng pearson', 'ask.pearson');

manager.addAnswer('vi', 'ask.algorithm', 'Hệ thống EduGuard sử dụng thuật toán Hồi quy tuyến tính (Linear Regression) kết hợp với Hệ số tương quan Pearson. AI phân tích điểm của các môn học tiên quyết (Prerequisites) để tính ra trọng số và dự đoán chính xác điểm môn tiếp theo.');
manager.addAnswer('vi', 'ask.pearson', 'Ma trận Pearson đo lường mức độ tương quan giữa 2 môn học (từ -1 đến 1). Nếu sinh viên rớt môn A mà thường xuyên rớt môn B, hệ số Pearson sẽ tiến gần về 1. Hệ thống dùng hệ số này làm trọng số (weight) để dự đoán điểm.');

// ============================================================
// 3. DẠY INTENT: HỎI VỀ CẢNH BÁO ĐỎ & MÔN TIÊN QUYẾT
// ============================================================
manager.addDocument('vi', 'cảnh báo đỏ là sao', 'ask.redalert');
manager.addDocument('vi', 'ai bị cảnh báo đỏ', 'ask.redalert');
manager.addDocument('vi', 'nguy cơ cao là gì', 'ask.redalert');
manager.addDocument('vi', 'môn tiên quyết là gì', 'ask.prerequisite');
manager.addDocument('vi', 'tại sao môn tiên quyết quan trọng', 'ask.prerequisite');

manager.addAnswer('vi', 'ask.redalert', 'Cảnh báo đỏ (Red Alerts) là danh sách các sinh viên được AI dự đoán sẽ có điểm dưới 5.0 ở môn học mục tiêu. Hệ thống sẽ ghim những sinh viên này lên đầu để giảng viên ưu tiên can thiệp trước khi quá muộn.');
manager.addAnswer('vi', 'ask.prerequisite', 'Môn tiên quyết là những môn học nền tảng. Ví dụ: Phải vững "Lập trình C" thì mới học tốt "Cấu trúc dữ liệu". EduGuard tìm ra các lỗ hổng kiến thức ở môn tiên quyết để báo động đỏ cho sinh viên.');

// ============================================================
// 4. DẠY INTENT: HỎI CÁCH SỬ DỤNG
// ============================================================
manager.addDocument('vi', 'làm sao để upload điểm', 'ask.how_upload');
manager.addDocument('vi', 'làm thế nào để tải file excel lên', 'ask.how_upload');
manager.addDocument('vi', 'chạy dự đoán thế nào', 'ask.how_predict');
manager.addDocument('vi', 'cách dùng cảnh báo đỏ', 'ask.how_predict');

manager.addAnswer('vi', 'ask.how_upload', 'Bạn có thể vào trang Chủ (Dashboard), bấm vào biểu tượng Tải lên hoặc kéo thả file Excel (danh sách điểm lớp hoặc bảng điểm cá nhân) vào khu vực upload. AI sẽ tự động đọc và làm sạch dữ liệu.');
manager.addAnswer('vi', 'ask.how_predict', 'Sau khi upload file thành công, bạn chỉ cần chọn Môn học muốn dự đoán từ danh sách sổ xuống và bấm "Phân tích rủi ro". AI sẽ hiển thị biểu đồ và danh sách rớt môn ngay lập tức.');

// ============================================================
// 5. GIAO TIẾP CƠ BẢN
// ============================================================
manager.addDocument('vi', 'xin chào', 'greetings.hello');
manager.addDocument('vi', 'chào bạn', 'greetings.hello');
manager.addDocument('vi', 'hi', 'greetings.hello');
manager.addDocument('vi', 'tạm biệt', 'greetings.bye');
manager.addDocument('vi', 'cảm ơn', 'greetings.thanks');
manager.addDocument('vi', 'ok cảm ơn', 'greetings.thanks');

manager.addAnswer('vi', 'greetings.hello', 'Xin chào! Tôi là Trợ lý ảo Cục bộ của EduGuard AI (Chạy Offline không cần Internet). Tôi có thể giúp gì cho bạn về hệ thống này?');
manager.addAnswer('vi', 'greetings.hello', 'Chào bạn! Tôi là Chatbot Local của EduGuard. Bạn muốn hỏi gì về tính năng hay thuật toán của dự án không?');
manager.addAnswer('vi', 'greetings.bye', 'Tạm biệt bạn. Chúc bạn một ngày làm việc hiệu quả với EduGuard!');
manager.addAnswer('vi', 'greetings.thanks', 'Không có chi! Rất vui được hỗ trợ bạn.');

// ============================================================
// HUẤN LUYỆN VÀ LƯU MODEL
// ============================================================
(async () => {
    console.log("⚙️  Training Local NLP Model... Please wait.");
    await manager.train();
    
    const modelPath = path.join(__dirname, 'chatbot_model.nlp');
    manager.save(modelPath);
    
    console.log("🎉 TRAINING COMPLETED SUCESSFULLY!");
    console.log(`📁 Local Chatbot Model saved at: ${modelPath}`);
    console.log("🧠 The EduGuard Offline Chatbot is now ready to fallback when Internet drops!");
    console.log("============================================================\n");
})();
