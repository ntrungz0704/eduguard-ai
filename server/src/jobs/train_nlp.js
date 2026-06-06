const { NlpManager } = require('node-nlp');
const path = require('path');
const fs = require('fs');

// Khởi tạo NLP Manager
const manager = new NlpManager({ languages: ['vi', 'en'], forceNER: true });
const modelPath = path.join(__dirname, '..', 'ai', 'models', 'nlp', 'chatbot_model.nlp');

// ============================================================
// 0. KHỞI TẠO HỆ SINH THÁI THỰC THỂ (ENTITIES) - DSS CORE
// ============================================================

// 0.1. Regex Entity (Mã Sinh Viên & Mã Lớp)
manager.addRegexEntity('student_id', ['vi', 'en'], /[A-Za-z]{2}\d{5}/gi);
manager.addRegexEntity('class_id', ['vi', 'en'], /[A-Za-z]{2,3}\d{4,5}/gi);

// 0.2. Regex Entity (Điểm số & Chuyên cần)
manager.addRegexEntity('score', ['vi', 'en'], /\b(10|[0-9](\.[0-9]{1,2})?)\s?(điểm|đ)?\b/gi);
manager.addRegexEntity('attendance_range', ['vi', 'en'], /\b(dưới |trên )?\d{1,3}\s?%\b/gi);

// 0.3. Named Entities
manager.addNamedEntityText('semester', 'Spring 2026', ['vi', 'en'], ['spring 2026', 'kỳ xuân 2026', 'học kỳ spring 2026']);
manager.addNamedEntityText('semester', 'Summer 2026', ['vi', 'en'], ['summer 2026', 'kỳ hè 2026', 'học kỳ summer 2026']);
manager.addNamedEntityText('semester', 'Fall 2026', ['vi', 'en'], ['fall 2026', 'kỳ thu 2026', 'học kỳ fall 2026']);

manager.addNamedEntityText('risk_level', 'CRITICAL', ['vi', 'en'], ['critical', 'báo động đỏ', 'nguy cơ rất cao', 'cực kỳ nguy hiểm']);
manager.addNamedEntityText('risk_level', 'HIGH', ['vi', 'en'], ['high', 'nguy cơ cao', 'nguy hiểm']);
manager.addNamedEntityText('risk_level', 'MEDIUM', ['vi', 'en'], ['medium', 'nguy cơ trung bình', 'trung bình']);
manager.addNamedEntityText('risk_level', 'LOW', ['vi', 'en'], ['low', 'nguy cơ thấp', 'an toàn']);

manager.addNamedEntityText('intervention_type', 'Phụ đạo', ['vi', 'en'], ['phụ đạo', 'học kèm', 'tutor']);
manager.addNamedEntityText('intervention_type', 'Cố vấn', ['vi', 'en'], ['cố vấn', 'tư vấn', 'họp 1-1']);
manager.addNamedEntityText('intervention_type', 'Gọi điện', ['vi', 'en'], ['gọi điện', 'call', 'gọi phụ huynh']);
manager.addNamedEntityText('intervention_type', 'Email', ['vi', 'en'], ['email', 'gửi mail', 'mail']);

manager.addNamedEntityText('timeframe', '2 tuần', ['vi', 'en'], ['2 tuần', 'hai tuần']);
manager.addNamedEntityText('timeframe', '4 tuần', ['vi', 'en'], ['4 tuần', 'bốn tuần', '1 tháng', 'một tháng']);
manager.addNamedEntityText('timeframe', 'Học kỳ tới', ['vi', 'en'], ['học kỳ tới', 'kỳ sau', 'học kỳ sau']);

// 0.4. Entity cho Môn học (Động)
try {
  const dataPath = path.join(__dirname, '..', 'datasets', 'training_data.json');
  if (fs.existsSync(dataPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const subjects = data.curriculumOrder || [];
    subjects.forEach((subject) => {
      const lower = subject.toLowerCase();
      manager.addNamedEntityText('subject', lower, ['vi'], [lower, subject, lower.replace(/ /g, ''), lower.replace(/tiếng anh/g, 'eng'), lower.replace(/lập trình/g, 'code')]);
    });
    console.log(`📚 Đã nạp thành công ${subjects.length} môn học vào bộ nhớ NER của NLP.`);
  }
} catch (e) {
  console.error('❌ Lỗi nạp môn học:', e.message);
}


// ============================================================
// LEVEL 1 — ANALYTICS (Phân tích hiện trạng)
// ============================================================

// 1. query.student
const queryStudent = [
  'tóm tắt tình hình sinh viên %student_id%', 'đánh giá sinh viên %student_id%', 'học lực của %student_id% thế nào',
  'em %student_id% có ổn không', 'đánh giá nhanh sinh viên này', 'xem hồ sơ %student_id%',
  'sinh viên %student_id% nguy hiểm không', 'gpa hiện tại của %student_id%', 'tình hình của sinh viên %student_id%',
  'thống kê kết quả %student_id%', 'có nguy cơ rớt môn không', 'tỷ lệ tốt nghiệp thế nào',
  'phân tích sinh viên %student_id%', 'tình hình học tập của em sao rồi'
];
queryStudent.forEach(text => manager.addDocument('vi', text, 'student.analysis'));

// 2. query.class
const queryClass = [
  'tình hình lớp %class_id%', 'phân tích lớp %class_id%', 'thống kê lớp %class_id%', 'overview lớp %class_id%',
  'sức khỏe học thuật của lớp %class_id%', 'tình hình chung của lớp %class_id%', 'lớp %class_id% thế nào rồi',
  'lớp %class_id% ra sao', 'tổng quan sinh viên lớp %class_id%', 'tình hình học tập chung lớp %class_id%',
  'tình hình toàn khóa', 'báo cáo học kỳ', 'thống kê nguy cơ học vụ', 'phân tích toàn bộ sinh viên'
];
queryClass.forEach(text => manager.addDocument('vi', text, 'query.class'));

// 3. query.subject
const querySubject = [
  '%subject% là môn gì', '%subject% có khó không', 'tỉ lệ rớt %subject%', 'nội dung %subject%',
  'phân tích môn %subject%', 'tình hình môn %subject%', 'tỉ lệ tạch môn %subject%',
  'môn %subject% sao', 'môn %subject% thế nào', 'fail rate môn %subject%', 'đề cương môn học %subject%',
  'môn %subject% học những gì', 'chi tiết môn học %subject%', 'thông tin môn %subject%'
];
querySubject.forEach(text => manager.addDocument('vi', text, 'query.subject'));

// 4. query.attendance
const queryAttendance = [
  'xem chuyên cần %student_id%', 'nó nghỉ học nhiều không', 'vắng bao nhiêu buổi',
  'chuyên cần của %student_id% thế nào', 'tình hình đi học của em đó', 'điểm danh của %student_id%',
  'nó đi học đủ không', 'sinh viên vắng nhiều không', 'tỉ lệ đi học của %student_id%',
  'vắng bao nhiêu buổi học', 'nó nghỉ học mấy buổi rồi', 'chuyên cần lớp %class_id%', 'tỉ lệ vắng'
];
queryAttendance.forEach(text => manager.addDocument('vi', text, 'query.attendance'));

// 5. query.risk
const queryRisk = [
  'quét toàn bộ hệ thống tìm sinh viên nguy hiểm', 'lọc ngay danh sách sinh viên báo động đỏ',
  'báo cáo tổng quan học kỳ những sinh viên yếu nhất', 'hệ thống đang cảnh báo những ai',
  'danh sách đỏ toàn trường', 'báo động đỏ', 'bao nhiêu sinh viên báo động đỏ',
  'lớp %class_id% nào nguy hiểm nhất', 'top sinh viên nguy cơ', 'ai dễ rớt nhất',
  'sv nào nguy hiểm', 'danh sách sinh viên nguy cơ', 'ai sắp rớt', 'critical students',
  'danh sách cần cứu gấp', 'những sinh viên nào cần can thiệp'
];
queryRisk.forEach(text => manager.addDocument('vi', text, 'query.risk'));


// ============================================================
// LEVEL 2 — EXPLANATION (Giải thích nguyên nhân)
// ============================================================

// 6. query.xai
const xai = [
  'vì sao %student_id% rủi ro cao', 'giải thích cảnh báo %student_id%', 'tại sao hệ thống đánh giá %risk_level%',
  'nguyên nhân chính là gì', 'yếu tố nào ảnh hưởng nhiều nhất đến %student_id%', 'cho tôi xem lý do',
  'tại sao nó đỏ', 'giải thích rủi ro của %student_id%', 'tại sao %student_id% bị cảnh báo',
  'nguyên nhân cốt lõi của rủi ro', 'giải thích tại sao %student_id% sắp rớt', 'vì sao %student_id% nguy cơ cao'
];
xai.forEach(text => manager.addDocument('vi', text, 'query.xai'));

// 7. query.prerequisite
const prerequisite = [
  'môn %subject% cần học gì trước', 'tiên quyết của %subject% là gì', 'giải thích chuỗi tiên quyết %subject%',
  'chuỗi môn học', 'môn chặn', 'dependency chain là gì', 'nợ môn nào kéo theo gì',
  'sơ đồ tiên quyết', 'bản đồ chuỗi môn học %subject%', 'môn %subject% bị chặn bởi môn nào',
  'nếu rớt môn này thì khóa môn nào', 'môn tiên quyết của %subject%'
];
prerequisite.forEach(text => manager.addDocument('vi', text, 'query.prerequisite'));

// 8. query.impact (Risk Chain)
const impact = [
  'nếu rớt %subject% thì ảnh hưởng gì', 'nếu nợ %subject% thì sao', 'nếu %student_id% nghỉ học thêm 3 buổi',
  'tác động của việc rớt %subject%', 'ảnh hưởng đến tiến độ tốt nghiệp thế nào',
  'nếu %student_id% rớt môn này thì hậu quả là gì', 'rớt môn %subject% có kéo theo rớt môn khác không',
  'hậu quả của việc nợ %subject%', 'ảnh hưởng dây chuyền nếu trượt %subject%',
  '%subject% ảnh hưởng môn nào', '%subject% ảnh hưởng gì'
];
impact.forEach(text => manager.addDocument('vi', text, 'knowledge.risk_chain'));

// ============================================================
// LEVEL 2.5 — CAREER (Nghề nghiệp)
// ============================================================

// 8.5. career.path
const careerPath = [
  'em muốn theo %careerGoal%', 'lộ trình %careerGoal%', 'nghề %careerGoal%', 
  'career path %careerGoal%', 'hướng đi %careerGoal%', 'muốn làm %careerGoal%',
  'em muốn theo backend developer', 'lộ trình frontend', 'muốn theo fullstack',
  'muốn theo frontend', 'lộ trình backend developer', 'muốn làm lập trình viên'
];
careerPath.forEach(text => manager.addDocument('vi', text, 'career.path'));


// ============================================================
// LEVEL 3 — PREDICTION (Dự báo)
// ============================================================

// 9. query.predict_future
const predictFuture = [
  'nếu không can thiệp %student_id% thì sao', 'trong %timeframe% nữa thế nào', 'khả năng bị cảnh báo học vụ của %student_id%',
  'dự báo nguy cơ trong tương lai', 'dự báo %timeframe%', 'tương lai của sinh viên %student_id%',
  'nếu tiếp tục như hiện tại thì sao', 'xu hướng học tập %timeframe%', 'mức độ rủi ro cuối kỳ',
  'khả năng rớt môn của %student_id% trong %timeframe%'
];
predictFuture.forEach(text => manager.addDocument('vi', text, 'query.predict_future'));

// 10. query.scenario
const scenario = [
  'nếu điểm cuối kỳ là %score%', 'nếu chuyên cần tăng lên %attendance_range%', 'nếu qua môn %subject%',
  'mô phỏng kịch bản %student_id% thi được %score%', 'giả lập nếu em này không nghỉ học nữa',
  'nếu gpa đạt %score%', 'kịch bản tốt nhất cho sinh viên này', 'chạy mô phỏng với điểm %score%',
  'nếu %student_id% đạt %score% môn %subject% thì sao'
];
scenario.forEach(text => manager.addDocument('vi', text, 'query.scenario'));


// ============================================================
// LEVEL 4 — DECISION (Ra quyết định)
// ============================================================

// 11. query.priority
const priority = [
  'top 10 sinh viên nguy hiểm', 'ai cần can thiệp khẩn cấp', 'danh sách ưu tiên cứu trợ',
  'can thiệp ai trước', 'xếp hạng mức độ khẩn cấp', 'đưa ra danh sách ưu tiên',
  'sinh viên nào phải cứu ngay lập tức', 'top những bạn critical', 'ưu tiên xử lý những ai',
  'ai cần cứu trước', 'danh sách khẩn cấp'
];
priority.forEach(text => manager.addDocument('vi', text, 'query.priority'));

// 12. query.intervention
const intervention = [
  'tôi nên làm gì', 'gợi ý hỗ trợ %student_id%', 'kế hoạch cứu sinh viên %student_id%',
  'nên liên hệ phụ huynh không', 'có cần %intervention_type% không', 'cách giảm rủi ro',
  'lộ trình can thiệp %student_id%', 'cứu sinh viên này', 'đề xuất can thiệp',
  'gợi ý giải pháp %intervention_type%', 'làm sao cứu em này', 'đề xuất %intervention_type%'
];
intervention.forEach(text => manager.addDocument('vi', text, 'query.intervention'));

// 13. query.compare_students
const compareStudents = [
  'so sánh %student_id% và %student_id%', 'ai nguy hiểm hơn', 'sinh viên nào cần can thiệp trước',
  'giữa %student_id% và %student_id% ai rủi ro cao hơn', 'đối chiếu 2 sinh viên này',
  'đánh giá mức độ rủi ro giữa %student_id% và %student_id%', 'ai yếu hơn giữa %student_id% và %student_id%',
  'nên ưu tiên %student_id% hay %student_id%'
];
compareStudents.forEach(text => manager.addDocument('vi', text, 'query.compare_students'));


// ============================================================
// LEVEL 5 — ACTION (Hành động)
// ============================================================

// 14. query.generate_message
const genMessage = [
  'soạn tin nhắn %intervention_type%', 'viết tin zalo', 'gửi cảnh báo nhẹ nhàng',
  'soạn tin nhắn nhắc nhở', 'viết tin nhắn can thiệp %student_id%', 'soạn mail',
  'mẫu tin nhắn gửi nó', 'soạn tin gửi em này', 'soạn thư gửi sinh viên',
  'viết tin nhắn %intervention_type% gửi %student_id%'
];
genMessage.forEach(text => manager.addDocument('vi', text, 'query.generate_message'));


// ============================================================
// UTILS
// ============================================================
const greetings = ['xin chào', 'hello', 'hi', 'chào bot', 'chào bạn'];
greetings.forEach(text => manager.addDocument('vi', text, 'greeting'));


// ============================================================
// Huấn luyện (Training Execution)
// ============================================================
(async () => {
  console.log("🚀 Đang tiến hành huấn luyện (Training) Mô hình NLP DSS 9.5/10 (Decision Support System)...");
  
  await manager.train();
  
  const mlDir = path.join(__dirname, '..', 'ai', 'models', 'nlp');
  if (!fs.existsSync(mlDir)) {
    fs.mkdirSync(mlDir, { recursive: true });
  }
  
  manager.save(modelPath);
  console.log(`✅ Huấn luyện thành công kiến trúc DSS NLP! Mô hình đã được lưu tại: ${modelPath}`);
})();
