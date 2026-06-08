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

// Dynamic Entities (Courses & Careers)
try {
  // Load courses
  const dataPath = path.join(__dirname, '..', 'datasets', 'training_data.json');
  if (fs.existsSync(dataPath)) {
    const data = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    const subjects = data.curriculumOrder || [];
    subjects.forEach((subject) => {
      const lower = subject.toLowerCase();
      manager.addNamedEntityText('subject', lower, ['vi'], [lower, subject, lower.replace(/ /g, ''), lower.replace(/tiếng anh/g, 'eng'), lower.replace(/lập trình/g, 'code')]);
    });
    console.log(`📚 Đã nạp thành công ${subjects.length} môn học vào bộ nhớ NER.`);
  }

  // Load careers
  const { getAllCareerNames, getCareerSynonyms } = require('../modules/chatbot/synonymEngine');
  const careers = getAllCareerNames();
  careers.forEach(career => {
    const synonyms = getCareerSynonyms(career);
    manager.addNamedEntityText('career', career, ['vi'], [career.toLowerCase(), ...synonyms]);
  });
  console.log(`💼 Đã nạp thành công ${careers.length} nghề nghiệp vào bộ nhớ NER.`);

} catch (e) {
  console.error('❌ Lỗi nạp Entity:', e.message);
}

// ============================================================
// 1. NẠP DỮ LIỆU HUẤN LUYỆN TỪ CORPUS JSON
// ============================================================
try {
  const corpusPath = path.join(__dirname, 'training_corpus.json');
  const corpus = JSON.parse(fs.readFileSync(corpusPath, 'utf8'));
  let totalDocs = 0;

  // Nạp Teacher Intents
  if (corpus.teacher_intents) {
    for (const [intentName, utterances] of Object.entries(corpus.teacher_intents)) {
      utterances.forEach(text => {
        manager.addDocument('vi', text, intentName);
        totalDocs++;
      });
    }
  }

  // Nạp Student Intents
  if (corpus.student_intents) {
    for (const [intentName, utterances] of Object.entries(corpus.student_intents)) {
      utterances.forEach(text => {
        manager.addDocument('vi', text, intentName);
        totalDocs++;
      });
    }
  }

  console.log(`🧠 Đã nạp ${totalDocs} câu mẫu huấn luyện từ Corpus.`);
} catch (e) {
  console.error('❌ Lỗi nạp Corpus JSON:', e.message);
  process.exit(1);
}

// ============================================================
// Huấn luyện (Training Execution)
// ============================================================
(async () => {
  console.log("🚀 Đang tiến hành huấn luyện (Training) NLP Model v3.0 (Student Brain & Fuzzy)...");
  
  await manager.train();
  
  const mlDir = path.join(__dirname, '..', 'ai', 'models', 'nlp');
  if (!fs.existsSync(mlDir)) {
    fs.mkdirSync(mlDir, { recursive: true });
  }
  
  manager.save(modelPath);
  console.log(`✅ Huấn luyện thành công kiến trúc AI NLP! Mô hình đã được lưu tại: ${modelPath}`);
})();
