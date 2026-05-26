const { NlpManager } = require('node-nlp');
const path = require('path');
const fs = require('fs');

// Khởi tạo NLP Manager
const manager = new NlpManager({ languages: ['vi', 'en'], forceNER: true });

// Đường dẫn lưu file mô hình
const modelPath = path.join(__dirname, '..', 'ai', 'models', 'nlp', 'chatbot_model.nlp');

// 1. Dạy AI hiểu các ý định (Intents)
// ==========================================

// Intent: Hỏi về học lực / điểm số (Academic)
manager.addDocument('vi', 'Hãy phân tích chi tiết kết quả học lực hiện tại của sinh viên này', 'query.academic_performance');
manager.addDocument('vi', 'Sinh viên này học lực thế nào', 'query.academic_performance');
manager.addDocument('vi', 'Đánh giá điểm số của em này', 'query.academic_performance');
manager.addDocument('vi', 'Xem kết quả học tập', 'query.academic_performance');
manager.addDocument('vi', 'Sinh viên này có giỏi không', 'query.academic_performance');
manager.addDocument('vi', 'xem điểm', 'query.academic_performance');
manager.addDocument('vi', 'gpa hiện tại', 'query.academic_performance');
manager.addDocument('vi', 'học lực ra sao', 'query.academic_performance');
manager.addDocument('vi', 'điểm yếu môn nào', 'query.academic_performance');

// Intent: Hỏi về lộ trình / can thiệp (Recommendation)
manager.addDocument('vi', 'Hãy lập lộ trình can thiệp học tập và kế hoạch ôn tập', 'query.learning_path');
manager.addDocument('vi', 'Làm sao để sinh viên này cải thiện điểm số', 'query.learning_path');
manager.addDocument('vi', 'Gợi ý giải pháp phụ đạo', 'query.learning_path');
manager.addDocument('vi', 'Lộ trình giúp em này qua môn', 'query.learning_path');
manager.addDocument('vi', 'Có lời khuyên nào cho sinh viên này không', 'query.learning_path');
manager.addDocument('vi', 'gợi ý cải thiện', 'query.learning_path');
manager.addDocument('vi', 'lộ trình học', 'query.learning_path');
manager.addDocument('vi', 'cần học gì', 'query.learning_path');
manager.addDocument('vi', 'cách cứu sinh viên này', 'query.learning_path');

// Intent: Hỏi về rủi ro / cảnh báo / Alert
manager.addDocument('vi', 'Môn nào có nguy cơ trượt học kỳ mới', 'query.risk_warning');
manager.addDocument('vi', 'Sinh viên này dễ tạch môn nào', 'query.risk_warning');
manager.addDocument('vi', 'Cảnh báo rủi ro học thuật', 'query.risk_warning');
manager.addDocument('vi', 'Danh sách môn nguy hiểm', 'query.risk_warning');
manager.addDocument('vi', 'Sinh viên này có nguy cơ rớt môn không', 'query.risk_warning');
manager.addDocument('vi', 'ai cần can thiệp gấp', 'query.risk_warning');
manager.addDocument('vi', 'sinh viên đỏ', 'query.risk_warning');
manager.addDocument('vi', 'critical students', 'query.risk_warning');
manager.addDocument('vi', 'đứa nào cứu gấp', 'query.risk_warning');

// Intent: Hỏi về hệ thống, cấu trúc, công thức (Không cần MSSV)
manager.addDocument('vi', 'bạn có thể làm gì', 'query.system_info');
manager.addDocument('vi', 'giới thiệu về hệ thống', 'query.system_info');
manager.addDocument('vi', 'kiến trúc hệ thống là gì', 'query.system_info');
manager.addDocument('vi', 'công thức pearson', 'query.system_info');
manager.addDocument('vi', 'chi tiết công thức', 'query.system_info');
manager.addDocument('vi', 'hệ thống hoạt động thế nào', 'query.system_info');
manager.addDocument('vi', 'Tổng quan chương trình đào tạo FPT có tổng cộng bao nhiêu môn học?', 'query.system_info');
manager.addDocument('vi', 'Mô hình phân tích chuỗi môn học tiên quyết hoạt động như thế nào?', 'query.system_info');
manager.addDocument('vi', 'help', 'query.system_info');
manager.addDocument('vi', 'giúp đỡ', 'query.system_info');

// Intent: Thống kê tổng quan lớp học / Top rủi ro
manager.addDocument('vi', 'thống kê hệ thống', 'query.statistics');
manager.addDocument('vi', 'Thống kê danh sách sinh viên học lực yếu có nguy cơ cao?', 'query.statistics');
manager.addDocument('vi', 'thống kê danh sách sinh viên học lực yếu', 'query.statistics');
manager.addDocument('vi', 'danh sách sinh viên nguy cơ', 'query.statistics');
manager.addDocument('vi', 'môn nào dễ tạch nhất hệ thống', 'query.statistics');
manager.addDocument('vi', 'tỉ lệ rớt môn', 'query.statistics');
manager.addDocument('vi', 'có bao nhiêu sinh viên', 'query.statistics');
manager.addDocument('vi', 'cho tôi biết top 5 sv học yếu', 'query.statistics');
manager.addDocument('vi', 'top 5 sv', 'query.statistics');
manager.addDocument('vi', 'top 10 sv', 'query.statistics');
manager.addDocument('vi', 'tình hình lớp học như thế nào', 'query.statistics');
manager.addDocument('vi', 'cho tôi biết sv nào có nguy cơ', 'query.statistics');
manager.addDocument('vi', 'ai sắp rớt', 'query.statistics');
manager.addDocument('vi', 'mấy đứa nguy hiểm nhất', 'query.statistics');
manager.addDocument('vi', 'top sinh viên yếu', 'query.statistics');
manager.addDocument('vi', 'đứa nào học tệ nhất', 'query.statistics');
manager.addDocument('vi', 'sinh viên đỏ nhất', 'query.statistics');
manager.addDocument('vi', 'danh sách cần cứu gấp', 'query.statistics');
manager.addDocument('vi', 'phân tích toàn lớp', 'query.statistics');

// Intent: Bottleneck Subject
manager.addDocument('vi', 'Môn nào dễ trượt nhất hệ thống?', 'query.bottleneck');
manager.addDocument('vi', 'môn nào dễ trượt nhất', 'query.bottleneck');
manager.addDocument('vi', 'môn nào kéo gpa cả lớp', 'query.bottleneck');
manager.addDocument('vi', 'môn tiên quyết nào gây fail dây chuyền nhiều nhất', 'query.bottleneck');
manager.addDocument('vi', 'môn khó nhất', 'query.bottleneck');
manager.addDocument('vi', 'môn fail nhiều', 'query.bottleneck');
manager.addDocument('vi', 'môn tiên quyết nguy hiểm', 'query.bottleneck');
manager.addDocument('vi', 'môn dễ rớt', 'query.bottleneck');
manager.addDocument('vi', 'môn dễ fail', 'query.bottleneck');
manager.addDocument('vi', 'môn bottleneck', 'query.bottleneck');
manager.addDocument('vi', 'môn nào dễ trượt', 'query.bottleneck');

// Intent: Trend
manager.addDocument('vi', 'xu hướng lớp học', 'query.trend');
manager.addDocument('vi', 'tình hình tuần này', 'query.trend');
manager.addDocument('vi', 'gpa đang tăng hay giảm', 'query.trend');

// Intent: Follow-up / Context
manager.addDocument('vi', 'đứa đầu tiên thì sao', 'query.followup');
manager.addDocument('vi', 'môn đó là môn gì', 'query.followup');
manager.addDocument('vi', 'vì sao', 'query.followup');
manager.addDocument('vi', 'chi tiết hơn', 'query.followup');
manager.addDocument('vi', 'tiếp tục', 'query.followup');
manager.addDocument('vi', 'giải thích thêm đi', 'query.followup');

// ==========================================
// 1.5. Dạy AI hiểu các ý định của Sinh viên (STUDENT AI)
// ==========================================

// STUDENT_OVERVIEW_INTENT
manager.addDocument('vi', 'tình hình học tập của tôi sao rồi', 'student.overview');
manager.addDocument('vi', 'tôi đang ổn không', 'student.overview');
manager.addDocument('vi', 'học lực hiện tại thế nào', 'student.overview');
manager.addDocument('vi', 'xem kết quả của tôi', 'student.overview');
manager.addDocument('vi', 'điểm trung bình của tôi', 'student.overview');

// STUDENT_RISK_INTENT
manager.addDocument('vi', 'tôi dễ rớt môn nào', 'student.risk');
manager.addDocument('vi', 'môn nào nguy hiểm nhất', 'student.risk');
manager.addDocument('vi', 'tôi sắp tạch môn nào', 'student.risk');
manager.addDocument('vi', 'có khả năng rớt môn không', 'student.risk');

// STUDENT_RECOMMENDATION_INTENT
manager.addDocument('vi', 'làm sao cải thiện gpa', 'student.recommendation');
manager.addDocument('vi', 'gợi ý học tập', 'student.recommendation');
manager.addDocument('vi', 'tôi nên học gì tuần này', 'student.recommendation');
manager.addDocument('vi', 'cách kéo điểm', 'student.recommendation');
manager.addDocument('vi', 'lên kế hoạch học tập', 'student.recommendation');

// STUDENT_MOTIVATION_INTENT
manager.addDocument('vi', 'tôi còn cứu được không', 'student.motivation');
manager.addDocument('vi', 'tôi học ngu quá', 'student.motivation');
manager.addDocument('vi', 'tôi stress', 'student.motivation');
manager.addDocument('vi', 'thấy nản quá', 'student.motivation');
manager.addDocument('vi', 'có hy vọng gì không', 'student.motivation');

// STUDENT_GPA_SIMULATION_INTENT
manager.addDocument('vi', 'nếu tôi được 8 final thì gpa bao nhiêu', 'student.gpa_simulation');
manager.addDocument('vi', 'tôi cần bao nhiêu điểm để qua môn', 'student.gpa_simulation');
manager.addDocument('vi', 'tính thử điểm gpa', 'student.gpa_simulation');
manager.addDocument('vi', 'mục tiêu điểm số', 'student.gpa_simulation');

// STUDENT_PROGRESS_INTENT
manager.addDocument('vi', 'tôi có tiến bộ không', 'student.progress');
manager.addDocument('vi', 'so với tuần trước thì sao', 'student.progress');
manager.addDocument('vi', 'thống kê tuần này', 'student.progress');

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
