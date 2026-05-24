const { NlpManager } = require('node-nlp');
const path = require('path');
const fs = require('fs');

// Khởi tạo NLP Manager
const manager = new NlpManager({ languages: ['vi', 'en'], forceNER: true });

// Đường dẫn lưu file mô hình
const modelPath = path.join(__dirname, '..', 'ai', 'models', 'nlp', 'chatbot_model.nlp');

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

// Intent: Hỏi về hệ thống, cấu trúc, công thức (Không cần MSSV)
manager.addDocument('vi', 'bạn có thể làm gì', 'query.system_info');
manager.addDocument('vi', 'giới thiệu về hệ thống', 'query.system_info');
manager.addDocument('vi', 'kiến trúc hệ thống là gì', 'query.system_info');
manager.addDocument('vi', 'công thức pearson', 'query.system_info');
manager.addDocument('vi', 'chi tiết công thức', 'query.system_info');
manager.addDocument('vi', 'hệ thống hoạt động thế nào', 'query.system_info');
manager.addDocument('vi', 'help', 'query.system_info');
manager.addDocument('vi', 'giúp đỡ', 'query.system_info');

// Intent: Hỏi về thống kê tổng quan (Không cần MSSV)
manager.addDocument('vi', 'thống kê hệ thống', 'query.statistics');
manager.addDocument('vi', 'thống kê danh sách sinh viên học lực yếu', 'query.statistics');
manager.addDocument('vi', 'danh sách sinh viên nguy cơ', 'query.statistics');
manager.addDocument('vi', 'môn nào dễ tạch nhất hệ thống', 'query.statistics');
manager.addDocument('vi', 'tỉ lệ rớt môn', 'query.statistics');
manager.addDocument('vi', 'có bao nhiêu sinh viên', 'query.statistics');
manager.addDocument('vi', 'cho tôi biết top 5 sv học yếu', 'query.statistics');
manager.addDocument('vi', 'top 5 sv', 'query.statistics');
manager.addDocument('vi', 'top 10 sv', 'query.statistics');
manager.addDocument('vi', 'tình hình lớp học như thế nào', 'query.statistics');
manager.addDocument('vi', 'môn nào dễ trượt nhất', 'query.statistics');
manager.addDocument('vi', 'môn nào kéo gpa cả lớp', 'query.statistics');
manager.addDocument('vi', 'môn tiên quyết nào gây fail dây chuyền nhiều nhất', 'query.statistics');
manager.addDocument('vi', 'ai cần can thiệp gấp', 'query.statistics');
manager.addDocument('vi', 'cho tôi biết sv nào có nguy cơ', 'query.statistics');

// 2. Dạy AI trả lời tĩnh (Answers)
// ==========================================
manager.addAnswer('vi', 'greeting', 'Chào bạn! Tôi là EduGuard AI, tôi có thể giúp gì cho bạn?');
manager.addDocument('vi', 'Xin chào', 'greeting');
manager.addDocument('vi', 'Hi', 'greeting');
manager.addDocument('vi', 'Hello', 'greeting');
manager.addDocument('vi', 'Lô', 'greeting');
manager.addDocument('vi', 'Chào', 'greeting');

(async () => {
  console.log("🚀 Đang tiến hành huấn luyện (Training) Mô hình NLP...");
  await manager.train();
  
  // Lưu mô hình
  const mlDir = path.join(__dirname, '..', 'ai', 'models', 'nlp');
  if (!fs.existsSync(mlDir)) {
    fs.mkdirSync(mlDir, { recursive: true });
  }
  
  manager.save(modelPath);
  console.log(`✅ Huấn luyện thành công! Mô hình đã được lưu tại: ${modelPath}`);
})();
