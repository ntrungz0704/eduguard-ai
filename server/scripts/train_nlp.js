const { NlpManager } = require('node-nlp');
const path = require('path');
const fs = require('fs');

// Khởi tạo NLP Manager
const manager = new NlpManager({ languages: ['vi', 'en'], forceNER: true });

// Đường dẫn lưu file mô hình
const modelPath = path.join(__dirname, '..', 'ml', 'chatbot_model.nlp');

// 1. Dạy AI hiểu các ý định (Intents)
// ==========================================

// Intent: Hỏi về học lực / điểm số
manager.addDocument('vi', 'Hãy phân tích chi tiết kết quả học lực hiện tại của sinh viên này', 'query.academic_performance');
manager.addDocument('vi', 'Sinh viên này học lực thế nào', 'query.academic_performance');
manager.addDocument('vi', 'Đánh giá điểm số của em này', 'query.academic_performance');
manager.addDocument('vi', 'Xem kết quả học tập', 'query.academic_performance');
manager.addDocument('vi', 'Sinh viên này có giỏi không', 'query.academic_performance');

// Intent: Hỏi về lộ trình / can thiệp
manager.addDocument('vi', 'Hãy lập lộ trình can thiệp học tập và kế hoạch ôn tập', 'query.learning_path');
manager.addDocument('vi', 'Làm sao để sinh viên này cải thiện điểm số', 'query.learning_path');
manager.addDocument('vi', 'Gợi ý giải pháp phụ đạo', 'query.learning_path');
manager.addDocument('vi', 'Lộ trình giúp em này qua môn', 'query.learning_path');
manager.addDocument('vi', 'Có lời khuyên nào cho sinh viên này không', 'query.learning_path');

// Intent: Hỏi về rủi ro / cảnh báo
manager.addDocument('vi', 'Môn nào có nguy cơ trượt học kỳ mới', 'query.risk_warning');
manager.addDocument('vi', 'Sinh viên này dễ tạch môn nào', 'query.risk_warning');
manager.addDocument('vi', 'Cảnh báo rủi ro học thuật', 'query.risk_warning');
manager.addDocument('vi', 'Danh sách môn nguy hiểm', 'query.risk_warning');
manager.addDocument('vi', 'Sinh viên này có nguy cơ rớt môn không', 'query.risk_warning');

// 2. Dạy AI trả lời tĩnh (Answers) - Có thể dùng nếu không muốn xử lý bằng Database
// (Trong api.js chúng ta đang dùng intent để trigger Database, nên phần này có thể bổ sung cho các câu xã giao)
// ==========================================
manager.addAnswer('vi', 'greeting', 'Chào bạn! Tôi là EduGuard AI, tôi có thể giúp gì cho bạn?');
manager.addDocument('vi', 'Xin chào', 'greeting');
manager.addDocument('vi', 'Hi', 'greeting');

(async () => {
  console.log("🚀 Đang tiến hành huấn luyện (Training) Mô hình NLP...");
  await manager.train();
  
  // Lưu mô hình
  const mlDir = path.join(__dirname, '..', 'ml');
  if (!fs.existsSync(mlDir)) {
    fs.mkdirSync(mlDir, { recursive: true });
  }
  
  manager.save(modelPath);
  console.log(`✅ Huấn luyện thành công! Mô hình đã được lưu tại: ${modelPath}`);
  console.log("💡 Bạn có thể khởi động lại Server (hoặc nó đã tự động reload) để AI nhận thức được kiến thức mới!");
})();
