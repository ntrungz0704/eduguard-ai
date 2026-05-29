const { extractMssv } = require('./entityExtractor');

function routeIntent(msg, nlpIntent = 'None', activeStudent = null) {
  const msgLower = (msg || '').toLowerCase().trim();

  // Keyword categories for heuristics
  const greetingKeywords = ["hello", "hi", "helo", "alo", "bạn làm được gì", "help", "xin chào", "chào", "trợ giúp", "bot ơi", "ê bot"];
  
  const classKeywords = [
    "tình hình lớp", "phân tích lớp", "thống kê lớp", "tình hình toàn lớp",
    "sức khỏe học thuật của lớp", "tình hình chung của lớp", "overview lớp", "dashboard lớp"
  ];
  
  const bottleneckKeywords = [
    "bottleneck", "môn dễ fail", "môn dễ rớt", "môn dễ tạch", "môn kéo gpa",
    "môn nào dễ trượt", "môn tiên quyết nguy hiểm", "môn khó nhất", "môn fail nhiều",
    "nút thắt cổ chai môn học", "môn tạch nhiều nhất", "tỉ lệ rớt môn", "môn nhiều người fail",
    "môn khó qua", "môn rớt nhiều"
  ];
  
  const highRiskKeywords = [
    "ai cần can thiệp", "sinh viên nguy cơ cao", "top sinh viên rủi ro", "danh sách sinh viên nguy cơ",
    "sinh viên học lực yếu", "thống kê danh sách sinh viên học lực yếu", "top 5 sv", "top 10 sv",
    "đứa nào học tệ nhất", "sinh viên đỏ nhất", "danh sách cần cứu gấp", "sv đỏ", "sinh viên đỏ",
    "critical students", "thằng học yếu nhất", "đứa học yếu nhất", "ai học yếu nhất", "cứu gấp",
    "ai dễ rớt nhất", "sv nào nguy hiểm", "top risk"
  ];
  
  const systemKeywords = [
    "hệ thống hoạt động thế nào", "thuật toán gì", "pearson", "regression", 
    "explainable ai", "dependency graph", "kiến trúc", "hybrid", "mô hình phân tích chuỗi",
    "hoạt động như thế nào", "tổng quan chương trình đào tạo", "bao nhiêu môn học"
  ];

  const outOfScopeKeywords = ["thời tiết", "youtube", "nấu ăn", "dịch hộ", "tin tức", "mở nhạc", "giá vàng", "ăn cơm chưa", "hát một bài"];
  const importKeywords = ["file import", "dòng fail", "nạp dữ liệu", "import excel", "lỗi import", "trạng thái import"];
  const prereqChainKeywords = ["chuỗi môn", "môn chặn", "dependency chain", "sơ đồ tiên quyết", "chuỗi tiên quyết", "dependency graph"];
  const messageGenKeywords = ["soạn tin", "viết tin", "zalo", "tin nhắn cảnh báo", "tin nhắn nhắc", "gửi cảnh báo nhẹ nhàng", "soạn email"];
  const gpaSimKeywords = ["nếu final", "nếu thi được", "cần bao nhiêu final", "qua môn", "mục tiêu điểm số", "GPA simulation"];

  const studentKeywords = ["phân tích sinh viên", "risk score của", "gpa của", "phân tích"];
  
  const followupKeywords = {
    ROOT_CAUSE: ["nguyên nhân", "vì sao", "tại sao", "rủi ro", "hổng", "mất gốc", "lý do", "giải thích risk", "tại sao nó đỏ", "giải thích chỉ số risk"],
    ATTENDANCE: ["chuyên cần", "vắng", "nghỉ", "đi học", "điểm danh", "cấm thi", "attendance"],
    INTERVENTION: ["can thiệp", "giải pháp", "khắc phục", "hỗ trợ", "cứu", "phụ đạo", "lộ trình can thiệp", "kế hoạch cứu"],
    TIMELINE: ["timeline", "lộ trình học tập", "nếu rớt môn", "nếu trượt môn", "nếu tạch môn", "ảnh hưởng môn"],
    STRENGTH: ["điểm mạnh", "thế mạnh", "môn nào giỏi", "học tốt", "thế mạnh", "điểm sáng"]
  };

  let intent = 'FALLBACK_INTENT';

  // Direct mapping from NLP
  if (nlpIntent === 'greeting') {
    intent = 'GREETING_INTENT';
  } else if (nlpIntent === 'query.class_analytics' || nlpIntent === 'CLASS_ANALYTICS') {
    intent = 'CLASS_ANALYTICS_INTENT';
  } else if (nlpIntent === 'query.high_risk_students' || nlpIntent === 'RISK_RANKING') {
    intent = 'HIGH_RISK_STUDENTS_INTENT';
  } else if (nlpIntent === 'query.bottleneck_subjects' || nlpIntent === 'query.bottleneck') {
    intent = 'BOTTLENECK_SUBJECTS_INTENT';
  } else if (nlpIntent === 'query.student_analysis' || nlpIntent === 'query.academic_performance') {
    intent = 'STUDENT_ANALYTICS_INTENT';
  } else if (nlpIntent === 'query.attendance') {
    intent = 'FOLLOWUP_ATTENDANCE_INTENT';
  } else if (nlpIntent === 'query.intervention') {
    intent = 'FOLLOWUP_INTERVENTION_INTENT';
  } else if (nlpIntent === 'query.generate_message') {
    intent = 'GENERATE_MESSAGE_INTENT';
  } else if (nlpIntent === 'query.prerequisite_chain') {
    intent = 'PREREQUISITE_CHAIN_INTENT';
  } else if (nlpIntent === 'query.xai') {
    intent = 'FOLLOWUP_ROOT_CAUSE_INTENT';
  } else if (nlpIntent === 'query.out_of_scope') {
    intent = 'OUT_OF_SCOPE_INTENT';
  } else if (nlpIntent === 'query.import_status') {
    intent = 'IMPORT_STATUS_INTENT';
  } else if (nlpIntent === 'query.gpa_simulation') {
    intent = 'GPA_SIMULATION_INTENT';
  } else if (nlpIntent === 'query.system_info') {
    intent = 'GENERAL_SYSTEM_INTENT';
  } else if (nlpIntent === 'query.risk_warning') {
    intent = 'HIGH_RISK_STUDENTS_INTENT';
  } else if (nlpIntent === 'query.recommendation' || nlpIntent === 'query.learning_path') {
    intent = 'FOLLOWUP_INTERVENTION_INTENT';
  } else if (nlpIntent === 'query.trend') {
    intent = 'CLASS_ANALYTICS_INTENT';
  } else if (nlpIntent === 'query.followup') {
    intent = 'STUDENT_ANALYTICS_INTENT'; // Let context resolver handle the exact student
  } else if (nlpIntent === 'query.syllabus' || nlpIntent === 'student.syllabus') {
    intent = 'SYLLABUS_INTENT';
  } else if (nlpIntent === 'query.attendance_analysis') {
    intent = 'FOLLOWUP_ATTENDANCE_INTENT';
  } 
  
  const contextualPhrases = [
    "em đó", "bạn đó", "sinh viên này", "em này", "bạn này", 
    "sinh viên đó", "đứa đó", "đứa này", "cu cậu", "cô bé", "cậu bé", "nhỏ này", "thằng này", "nó"
  ];
  
  // If no direct map or fallback, try heuristics
  if (intent === 'FALLBACK_INTENT') {
    if (greetingKeywords.some(kw => msgLower === kw || msgLower.startsWith(kw + ' ') || msgLower.endsWith(' ' + kw))) {
      intent = 'GREETING_INTENT';
    } else if (outOfScopeKeywords.some(kw => msgLower.includes(kw))) {
      intent = 'OUT_OF_SCOPE_INTENT';
    } else if (importKeywords.some(kw => msgLower.includes(kw))) {
      intent = 'IMPORT_STATUS_INTENT';
    } else if (prereqChainKeywords.some(kw => msgLower.includes(kw))) {
      intent = 'PREREQUISITE_CHAIN_INTENT';
    } else if (messageGenKeywords.some(kw => msgLower.includes(kw))) {
      intent = 'GENERATE_MESSAGE_INTENT';
    } else if (gpaSimKeywords.some(kw => msgLower.includes(kw))) {
      intent = 'GPA_SIMULATION_INTENT';
    } else if (bottleneckKeywords.some(kw => msgLower.includes(kw))) {
      intent = 'BOTTLENECK_SUBJECTS_INTENT';
    } else if (highRiskKeywords.some(kw => msgLower.includes(kw))) {
      intent = 'HIGH_RISK_STUDENTS_INTENT';
    } else if (classKeywords.some(kw => msgLower.includes(kw))) {
      intent = 'CLASS_ANALYTICS_INTENT';
    } else if (systemKeywords.some(kw => msgLower.includes(kw))) {
      intent = 'GENERAL_SYSTEM_INTENT';
    } else {
      let matchedFollowup = null;
      for (const [intentName, keywords] of Object.entries(followupKeywords)) {
        if (keywords.some(kw => msgLower.includes(kw))) {
          matchedFollowup = intentName;
          break;
        }
      }
      
      if (matchedFollowup) {
        intent = `FOLLOWUP_${matchedFollowup}_INTENT`;
      } else {
        const hasMssv = extractMssv(msgLower);
        const hasContextualPhrase = contextualPhrases.some(kw => msgLower.includes(kw));
        const hasStudentAction = studentKeywords.some(kw => msgLower.includes(kw)) || msgLower.includes("đánh giá") || msgLower.includes("xem nguy cơ") || msgLower.includes("khả năng qua môn");

        if (hasMssv || hasStudentAction || (hasContextualPhrase && activeStudent)) {
          intent = 'STUDENT_ANALYTICS_INTENT';
        } else if (hasContextualPhrase && !activeStudent) {
          // Vẫn map sang sinh viên nhưng vì activeStudent rỗng -> báo lỗi "Thầy muốn đánh giá ai?"
          intent = 'STUDENT_ANALYTICS_INTENT';
        }
      }
    }
  }

  console.log(`[AI_ROUTER] Routed Intent: ${intent} | Message: "${msg}" | NLP: ${nlpIntent}`);
  return intent;
}

module.exports = {
  routeIntent
};
