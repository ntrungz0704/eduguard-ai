const { NlpManager } = require('node-nlp');
const fs = require('fs');
const path = require('path');

console.log("============================================================");
console.log("🤖 EDUGUARD AI - ADVANCED INTENT CLASSIFIER TRAINING MODULE");
console.log("============================================================");

const manager = new NlpManager({ languages: ['vi', 'en'], forceNER: true, autoSave: false });

// ============================================================
// 1. DYNAMIC INTENT: TÌM SINH VIÊN RỦI RO / CẢNH BÁO
// (query.risk_students)
// ============================================================
const riskUtterances = [
  'những ai sắp rớt', 'đứa nào sắp toang', 'sinh viên nguy cơ rớt',
  'danh sách sinh viên yếu', 'lớp có ai đáng lo không', 'ai học yếu',
  'top sinh viên yếu', 'những sinh viên nào cần can thiệp',
  'hiển thị cho tôi sinh viên bị cảnh báo', 'em nào sắp tạch',
  'em nào rủi ro cao', 'ai sắp bay màu', 'danh sách cảnh báo đỏ',
  'show ra từng cái cho tôi xem', 'show danh sách rớt', 'liệt kê sv rớt'
];
riskUtterances.forEach(utt => manager.addDocument('vi', utt, 'query.risk_students'));

// ============================================================
// 2. DYNAMIC INTENT: PHÂN TÍCH MÔN HỌC YẾU KẾM
// (query.weak_subjects)
// ============================================================
const subjectUtterances = [
  'môn nào dễ rớt nhất', 'môn nào sinh viên chết nhiều nhất',
  'môn học yếu', 'thống kê rớt môn', 'tỷ lệ rớt các môn là bao nhiêu',
  'môn nào điểm thấp nhất', 'học phần nào dễ tạch',
  'môn nào khó nhất', 'sinh viên lớp này hay rớt môn gì',
  'môn gì hay rớt', 'môn nào dễ chết nhất'
];
subjectUtterances.forEach(utt => manager.addDocument('vi', utt, 'query.weak_subjects'));

// ============================================================
// 3. STATIC INTENT: THUẬT TOÁN & HỆ THỐNG
// ============================================================
manager.addDocument('vi', 'EduGuard là gì', 'ask.intro');
manager.addDocument('vi', 'hệ thống này làm được gì', 'ask.intro');
manager.addDocument('vi', 'có những tính năng nào', 'ask.features');

manager.addAnswer('vi', 'ask.intro', 'EduGuard AI là hệ thống Cảnh báo sớm và Can thiệp học vụ tự động sử dụng AI.');
manager.addAnswer('vi', 'ask.features', 'Hệ thống có 3 tính năng chính: 1. Cảnh báo Đỏ (Dự đoán rớt môn bằng AI). 2. Quản lý Can thiệp (Theo dõi và gửi lộ trình khắc phục cho sinh viên). 3. Trợ lý AI Pipeline (Như tôi đây).');

// ============================================================
// 4. STATIC INTENT: GIAO TIẾP
// ============================================================
manager.addDocument('vi', 'xin chào', 'greetings.hello');
manager.addDocument('vi', 'chào bạn', 'greetings.hello');
manager.addAnswer('vi', 'greetings.hello', 'Xin chào! Tôi là Trợ lý AI Pipeline (Offline). Tôi có thể truy vấn CSDL để tìm ra những sinh viên sắp rớt hoặc môn học khó nhằn nhất. Bạn muốn hỏi gì?');

// ============================================================
// HUẤN LUYỆN VÀ LƯU MODEL
// ============================================================
(async () => {
    console.log("⚙️  Training Intent Classifier Model... Please wait.");
    await manager.train();
    
    const modelPath = path.join(__dirname, 'chatbot_model.nlp');
    manager.save(modelPath);
    
    console.log("🎉 TRAINING COMPLETED SUCESSFULLY!");
    console.log(`📁 Local Chatbot Model saved at: ${modelPath}`);
    console.log("🧠 The EduGuard Intent Pipeline is ready!");
    console.log("============================================================\n");
})();
