const { NlpManager } = require('node-nlp');
const path = require('path');
const fs = require('fs');

// Khởi tạo NLP Manager
const manager = new NlpManager({ languages: ['vi', 'en'], forceNER: true });

// Đường dẫn lưu file mô hình
const modelPath = path.join(__dirname, '..', 'ai', 'models', 'nlp', 'chatbot_model.nlp');

// 1. DẠY AI CHO CHẾ ĐỘ GIẢNG VIÊN (TEACHER MODE)
// ==========================================

// --- Intent 1: GREETING & WELCOME ---
const greetings = [
  'hi', 'hello', 'alo', 'chào', 'chào bot', 'xin chào', 'hello eduguard', 'ê bot', 'bot ơi',
  'chào bạn', 'xin chào eduguard', 'hi eduguard', 'lô bot', 'chào buổi sáng', 'chào trợ lý',
  'hello trợ lý học vụ', 'chào dss', 'dss ơi', 'chào robot', 'chào eduguard ai'
];
greetings.forEach(text => manager.addDocument('vi', text, 'greeting'));

// --- Intent 2: CLASS ANALYTICS ---
const classAnalytics = [
  'tình hình lớp học', 'phân tích lớp', 'thống kê lớp', 'overview lớp', 'dashboard lớp',
  'phân tích toàn bộ sinh viên', 'tình hình lớp', 'tình hình toàn lớp', 'tình hình chung của lớp',
  'sức khỏe học thuật của lớp', 'thống kê toàn lớp học', 'phân tích toàn lớp', 'overview lớp học',
  'cho tôi xem dashboard lớp', 'thống kê tình trạng lớp học', 'class analytics', 'tổng quan lớp học',
  'tình hình chung lớp này thế nào', 'cho xem thống kê lớp', 'lớp học thế nào rồi'
];
classAnalytics.forEach(text => manager.addDocument('vi', text, 'query.class_analytics'));

// --- Intent 3: HIGH RISK STUDENTS ---
const highRisk = [
  'top sinh viên nguy cơ', 'ai dễ rớt nhất', 'sv nào nguy hiểm', 'top risk', 'sinh viên đỏ',
  'danh sách sinh viên nguy cơ', 'top sinh viên rủi ro', 'ai sắp rớt', 'đứa nào rủi ro nhất',
  'mấy đứa nguy hiểm nhất', 'đứa nào học tệ nhất', 'sinh viên đỏ nhất', 'danh sách cần cứu gấp',
  'ai nguy cơ cao nhất', 'critical students', 'top sinh viên yếu', 'đứa nào cứu gấp',
  'thằng học yếu nhất', 'đứa học yếu nhất', 'ai học yếu nhất', 'cứu gấp', 'ai dễ tạch nhất',
  'sinh viên nguy hiểm', 'sv đỏ nhất', 'top học lực yếu', 'danh sách đỏ', 'báo động đỏ sinh viên'
];
highRisk.forEach(text => manager.addDocument('vi', text, 'query.high_risk_students'));

// --- Intent 4: STUDENT ANALYSIS ---
const studentAnalysis = [
  'phân tích sinh viên đầu tiên', 'đánh giá em đó', 'xem học lực nó', 'sv này sao',
  'đứa đầu tiên học sao', 'phân tích sinh viên này', 'đánh giá sinh viên này', 'đánh giá em này',
  'nó học lực ra sao', 'sv đó học hành thế nào', 'đánh giá em đầu tiên', 'phân tích đứa đầu tiên',
  'phân tích chi tiết kết quả học lực hiện tại của sinh viên này', 'sinh viên này học lực thế nào',
  'đánh giá điểm số của em này', 'xem kết quả học tập', 'sinh viên này có giỏi không', 'gpa hiện tại của nó',
  'học lực em này ra sao', 'điểm số em đó thế nào', 'học lực của sinh viên đầu tiên', 'phân tích đứa thứ hai',
  'sinh viên thứ hai thế nào', 'đánh giá đứa cuối cùng', 'cuối cùng học lực sao'
];
studentAnalysis.forEach(text => manager.addDocument('vi', text, 'query.student_analysis'));

// --- Intent 5: ATTENDANCE ANALYSIS ---
const attendance = [
  'xem chuyên cần', 'attendance', 'nới nghỉ học nhiều không', 'vắng bao nhiêu buổi',
  'nó nghỉ học nhiều không', 'chuyên cần của nó thế nào', 'tình hình đi học của em đó',
  'vắng chuyên cần', 'điểm danh của nó', 'nó đi học đủ không', 'chuyên cần em này ra sao',
  'sinh viên vắng nhiều không', 'tỉ lệ đi học', 'đi học đầy đủ không', 'vắng bao nhiêu buổi học',
  'attendance của nó thế nào', 'chuyên cần của em đó', 'nó nghỉ học mấy buổi rồi', 'chuyên cần lớp'
];
attendance.forEach(text => manager.addDocument('vi', text, 'query.attendance'));

// --- Intent 6: INTERVENTION PLAN ---
const intervention = [
  'lộ trình can thiệp', 'cứu sinh viên này', 'gửi cảnh báo', 'nên làm gì', 'phụ đạo sao',
  'lộ trình can thiệp học tập và kế hoạch ôn tập', 'làm sao để sinh viên này cải thiện điểm số',
  'gợi ý giải pháp phụ đạo', 'lộ trình giúp em này qua môn', 'có lời khuyên nào cho sinh viên này không',
  'gợi ý cải thiện', 'lộ trình học', 'cần học gì', 'cách cứu sinh viên này', 'đề xuất can thiệp',
  'lộ trình cứu sinh viên', 'can thiệp cho nó', 'cứu đứa này', 'đề xuất phụ đạo cho nó',
  'kế hoạch cứu sinh viên đỏ', 'cải thiện kết quả học tập thế nào'
];
intervention.forEach(text => manager.addDocument('vi', text, 'query.intervention'));

// --- Intent 7: MESSAGE GENERATION ---
const genMessage = [
  'soạn tin nhắn', 'viết tin zalo', 'gửi cảnh báo nhẹ nhàng', 'soạn tin nhắn cảnh báo',
  'viết tin nhắn nhắc nhở', 'soạn email cảnh báo', 'soạn thư gửi sinh viên', 'soạn tin nhắn zalo cứu sinh viên',
  'viết tin nhắn can thiệp', 'soạn tin can thiệp', 'mẫu tin nhắn gửi nó', 'soạn tin gửi em này',
  'viết mail phụ đạo', 'soạn thư cảnh báo chuyên cần', 'mẫu tin nhắn zalo', 'soạn tin nhắn nhắc vắng'
];
genMessage.forEach(text => manager.addDocument('vi', text, 'query.generate_message'));

// --- Intent 8: BOTTLENECK SUBJECTS ---
const bottleneck = [
  'môn dễ rớt', 'môn bottleneck', 'môn nào fail nhiều', 'môn nguy hiểm nhất',
  'môn nào dễ trượt nhất hệ thống?', 'môn nào dễ trượt nhất', 'môn nào kéo gpa cả lớp',
  'môn tiên quyết nào gây fail dây chuyền nhiều nhất', 'môn khó nhất', 'môn fail nhiều',
  'môn tiên quyết nguy hiểm', 'môn dễ fail', 'môn bottleneck', 'môn nào dễ trượt',
  'môn nhiều người fail', 'môn khó qua', 'môn tạch nhiều nhất', 'môn nào tạch nhiều nhất',
  'nút thắt cổ chai môn học', 'môn tạch nhiều', 'môn rớt nhiều', 'môn khó', 'tỉ lệ rớt môn',
  'môn dễ tạch nhất hệ thống', 'môn học nguy hiểm', 'môn học rớt nhiều nhất', 'nút thắt cổ chai'
];
bottleneck.forEach(text => manager.addDocument('vi', text, 'query.bottleneck'));

// --- Intent 9: SYLLABUS & CURRICULUM ---
const syllabus = [
  'syllabus web206', 'môn tiên quyết là gì', 'ltw học gì', 'fpt có bao nhiêu môn',
  'đề cương môn học', 'nội dung môn học này là gì', 'đề cương chi tiết môn này',
  'cho xem đề cương môn', 'môn này học những gì', 'syllabus môn', 'nội dung môn',
  'chương trình đào tạo gồm những môn gì', 'syllabus com108', 'syllabus web104',
  'môn tiên quyết của môn này là gì', 'tiên quyết của môn', 'com108 học gì',
  'tiên quyết của web206', 'syllabus pro101', 'đề cương môn lập trình java'
];
syllabus.forEach(text => manager.addDocument('vi', text, 'query.syllabus'));

// --- Intent 10: PREREQUISITE GRAPH CHAIN ---
const prereqChain = [
  'chuỗi môn học', 'môn chặn', 'dependency chain', 'nợ môn nào kéo theo gì',
  'chuỗi môn tiên quyết', 'sơ đồ tiên quyết', 'bản đồ chuỗi môn học', 'chuỗi môn học ảnh hưởng',
  'dependency graph môn học', 'chuỗi tiên quyết', 'nợ môn này ảnh hưởng môn nào',
  'môn chặn dây chuyền', 'chuỗi môn học kéo theo', 'môn nào chặn môn nào'
];
prereqChain.forEach(text => manager.addDocument('vi', text, 'query.prerequisite_chain'));

// --- Intent 11: RISK EXPLAINABILITY (XAI) ---
const riskExplain = [
  'vì sao risk cao', 'giải thích risk', 'tại sao nó đỏ', 'tại sao sinh viên này rủi ro',
  'giải thích nguyên nhân rủi ro', 'vì sao nguy cơ cao', 'tại sao risk score 92',
  'nguyên nhân cốt lõi của rủi ro', 'giải thích tại sao nó rủi ro', 'tại sao nó bị đỏ',
  'lý do rủi ro là gì', 'giải thích chỉ số risk', 'tại sao điểm rủi ro cao',
  'nguyên nhân rủi ro dây chuyền', 'giải thích vì sao nó sắp rớt', 'vì sao nó đỏ'
];
riskExplain.forEach(text => manager.addDocument('vi', text, 'query.xai'));

// --- Intent 12: OUT OF SCOPE DETECTION ---
const outOfScope = [
  'hôm nay thời tiết sao', 'mở youtube đi', 'bạn ăn cơm chưa', 'thời tiết tuần này',
  'hướng dẫn nấu ăn', 'dịch hộ tôi đoạn này', 'giá vàng hôm nay', 'tình hình covid',
  'tin tức hôm nay', 'mở nhạc trẻ', 'mua đồ ở đâu', 'hát một bài đi', 'kể chuyện hài đi'
];
outOfScope.forEach(text => manager.addDocument('vi', text, 'query.out_of_scope'));

// --- Intent 13: EXCEL IMPORT STATUS ---
const importStatus = [
  'file import lỗi gì', 'bao nhiêu dòng fail', 'trạng thái import', 'kết quả import file',
  'lịch sử import', 'import excel thành công bao nhiêu', 'dòng nào bị lỗi import',
  'lỗi file import excel', 'kết quả nạp dữ liệu', 'import dữ liệu thế nào rồi',
  'file vừa tải lên lỗi gì không', 'import excel status'
];
importStatus.forEach(text => manager.addDocument('vi', text, 'query.import_status'));

// --- Intent 14: GPA SIMULATION ---
const gpaSimulation = [
  'nếu final 8 thì sao', 'cần bao nhiêu điểm để qua', 'nếu tôi được 8 final thì gpa bao nhiêu',
  'tính thử điểm gpa', 'mục tiêu điểm số', 'nếu thi được 9 điểm final', 'nếu điểm asm được 8',
  'cần bao nhiêu final để qua môn', 'nếu final được 5', 'nếu điểm cuối kỳ được 10',
  'gpa dự báo nếu final 7'
];
gpaSimulation.forEach(text => manager.addDocument('vi', text, 'query.gpa_simulation'));

// --- Intent 15: GENERAL SYSTEM INFO ---
const systemInfo = [
  'bạn có thể làm gì', 'giới thiệu về hệ thống', 'kiến trúc hệ thống là gì',
  'công thức pearson', 'chi tiết công thức', 'hệ thống hoạt động thế nào',
  'tổng quan chương trình đào tạo FPT có tổng cộng bao nhiêu môn học?',
  'Mô hình phân tích chuỗi môn học tiên quyết hoạt động như thế nào?',
  'help', 'giúp đỡ', 'FPT có bao nhiêu môn', 'chương trình đào tạo',
  'explainable ai', 'kiến trúc DSS'
];
systemInfo.forEach(text => manager.addDocument('vi', text, 'query.system_info'));


// 2. DẠY AI CHO CHẾ ĐỘ SINH VIÊN (STUDENT MODE)
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

// STUDENT_SYLLABUS_INTENT
manager.addDocument('vi', 'môn này tôi sẽ học gì', 'student.syllabus');
manager.addDocument('vi', 'nội dung khóa học', 'student.syllabus');
manager.addDocument('vi', 'đề cương của môn', 'student.syllabus');


// ==========================================
// 3. Huấn luyện (Training Execution)
// ==========================================
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
