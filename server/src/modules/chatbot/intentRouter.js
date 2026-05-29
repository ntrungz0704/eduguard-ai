const { extractMssv } = require('./entityExtractor');

/**
 * Intent Router v2.0 — Production-grade routing with entity-first priority
 * 
 * Architecture:
 * 1. NLP direct mapping (high confidence)
 * 2. Entity-first detection (MSSV → student analysis)
 * 3. Keyword heuristic fallback
 * 4. Context-aware follow-up routing
 */
function routeIntent(msg, nlpIntent = 'None', activeStudent = null) {
  const msgLower = (msg || '').toLowerCase().trim();

  // ════════════════════════════════════════════
  // STEP 1: NLP Direct Mapping (priority #1)
  // ════════════════════════════════════════════
  const NLP_INTENT_MAP = {
    'greeting': 'GREETING_INTENT',
    'system.capabilities': 'CAPABILITIES_INTENT',
    'query.class_analytics': 'CLASS_ANALYTICS_INTENT',
    'CLASS_ANALYTICS': 'CLASS_ANALYTICS_INTENT',
    'query.high_risk_students': 'HIGH_RISK_STUDENTS_INTENT',
    'RISK_RANKING': 'HIGH_RISK_STUDENTS_INTENT',
    'query.bottleneck_subjects': 'BOTTLENECK_SUBJECTS_INTENT',
    'query.bottleneck': 'BOTTLENECK_SUBJECTS_INTENT',
    'query.student_analysis': 'STUDENT_ANALYTICS_INTENT',
    'query.academic_performance': 'STUDENT_ANALYTICS_INTENT',
    'query.attendance': 'FOLLOWUP_ATTENDANCE_INTENT',
    'query.intervention': 'FOLLOWUP_INTERVENTION_INTENT',
    'query.generate_message': 'GENERATE_MESSAGE_INTENT',
    'query.prerequisite_chain': 'PREREQUISITE_CHAIN_INTENT',
    'query.xai': 'FOLLOWUP_ROOT_CAUSE_INTENT',
    'query.out_of_scope': 'OUT_OF_SCOPE_INTENT',
    'query.import_status': 'IMPORT_STATUS_INTENT',
    'query.gpa_simulation': 'GPA_SIMULATION_INTENT',
    'query.prerequisite_explanation': 'PREREQUISITE_EXPLANATION_INTENT',
    'query.student_prediction': 'STUDENT_ANALYTICS_INTENT',
    'query.curriculum_info': 'CURRICULUM_INFO_INTENT',
    'query.followup_student': 'STUDENT_ANALYTICS_INTENT',
    'query.subject_analysis': 'SUBJECT_ANALYSIS_INTENT',
    'query.system_info': 'GENERAL_SYSTEM_INTENT',
    'query.risk_warning': 'HIGH_RISK_STUDENTS_INTENT',
    'query.recommendation': 'FOLLOWUP_INTERVENTION_INTENT',
    'query.learning_path': 'FOLLOWUP_INTERVENTION_INTENT',
    'query.trend': 'CLASS_ANALYTICS_INTENT',
    'query.followup': 'STUDENT_ANALYTICS_INTENT',
    'query.syllabus': 'SYLLABUS_INTENT',
    'student.syllabus': 'SYLLABUS_INTENT',
    'query.attendance_analysis': 'FOLLOWUP_ATTENDANCE_INTENT'
  };

  let intent = NLP_INTENT_MAP[nlpIntent] || 'FALLBACK_INTENT';

  // ════════════════════════════════════════════
  // STEP 2: Entity-First Priority Detection
  // If user typed an MSSV, it ALWAYS means student analysis
  // ════════════════════════════════════════════
  if (intent === 'FALLBACK_INTENT') {
    const hasMssv = extractMssv(msgLower);
    if (hasMssv) {
      intent = 'STUDENT_ANALYTICS_INTENT';
      console.log(`[AI_ROUTER] Entity-first: MSSV detected → STUDENT_ANALYTICS_INTENT`);
    }
  }

  // ════════════════════════════════════════════
  // STEP 3: Keyword Heuristic Fallback
  // ════════════════════════════════════════════
  if (intent === 'FALLBACK_INTENT') {
    intent = keywordHeuristicRoute(msgLower, activeStudent);
  }

  console.log(`[AI_ROUTER] Routed Intent: ${intent} | Message: "${msg}" | NLP: ${nlpIntent}`);
  return intent;
}

/**
 * Keyword-based heuristic routing as fallback when NLP fails
 */
function keywordHeuristicRoute(msgLower, activeStudent) {
  // Greeting
  const greetingKeywords = ["hello", "hi", "helo", "alo", "xin chào", "chào", "bot ơi", "ê bot"];
  if (greetingKeywords.some(kw => msgLower === kw || msgLower.startsWith(kw + ' ') || msgLower.endsWith(' ' + kw))) {
    return 'GREETING_INTENT';
  }

  // Capabilities
  const capKeywords = ["bạn làm được gì", "help", "chức năng", "feature", "hỗ trợ gì", "capabilities", "hướng dẫn", "trợ giúp", "có thể làm gì", "commands", "giúp đỡ", "menu", "cách dùng"];
  if (capKeywords.some(kw => msgLower.includes(kw))) {
    return 'CAPABILITIES_INTENT';
  }

  // Out of scope (check early to avoid false positives)
  const outOfScopeKeywords = ["thời tiết", "youtube", "nấu ăn", "dịch hộ", "tin tức", "mở nhạc", "giá vàng", "ăn cơm chưa", "hát một bài", "bóng đá", "tỉ giá"];
  if (outOfScopeKeywords.some(kw => msgLower.includes(kw))) {
    return 'OUT_OF_SCOPE_INTENT';
  }

  // Import status
  const importKeywords = ["file import", "dòng fail", "nạp dữ liệu", "import excel", "lỗi import", "trạng thái import"];
  if (importKeywords.some(kw => msgLower.includes(kw))) {
    return 'IMPORT_STATUS_INTENT';
  }

  // Prerequisite chain
  const prereqChainKeywords = ["chuỗi môn", "môn chặn", "dependency chain", "sơ đồ tiên quyết", "chuỗi tiên quyết", "dependency graph", "risk chain"];
  if (prereqChainKeywords.some(kw => msgLower.includes(kw))) {
    return 'PREREQUISITE_CHAIN_INTENT';
  }

  // Message generation
  const messageGenKeywords = ["soạn tin", "viết tin", "zalo", "tin nhắn cảnh báo", "tin nhắn nhắc", "gửi cảnh báo nhẹ nhàng", "soạn email", "gửi mail"];
  if (messageGenKeywords.some(kw => msgLower.includes(kw))) {
    return 'GENERATE_MESSAGE_INTENT';
  }

  // GPA simulation
  const gpaSimKeywords = ["nếu final", "nếu thi được", "cần bao nhiêu final", "mục tiêu điểm số", "gpa simulation", "giả lập điểm", "tính thử gpa"];
  if (gpaSimKeywords.some(kw => msgLower.includes(kw))) {
    return 'GPA_SIMULATION_INTENT';
  }

  // Bottleneck subjects
  const bottleneckKeywords = [
    "bottleneck", "môn dễ fail", "môn dễ rớt", "môn dễ tạch", "môn kéo gpa",
    "môn nào dễ trượt", "môn tiên quyết nguy hiểm", "môn khó nhất", "môn fail nhiều",
    "nút thắt cổ chai", "môn tạch nhiều nhất", "tỉ lệ rớt môn", "môn nhiều người fail",
    "môn khó qua", "môn rớt nhiều", "môn nguy hiểm", "môn nào nhiều sv tạch"
  ];
  if (bottleneckKeywords.some(kw => msgLower.includes(kw))) {
    return 'BOTTLENECK_SUBJECTS_INTENT';
  }

  // High risk students
  const highRiskKeywords = [
    "ai cần can thiệp", "sinh viên nguy cơ cao", "top sinh viên rủi ro", "danh sách sinh viên nguy cơ",
    "sinh viên học lực yếu", "thống kê danh sách sinh viên học lực yếu", "top 5 sv", "top 10 sv",
    "đứa nào học tệ nhất", "sinh viên đỏ nhất", "danh sách cần cứu gấp", "sv đỏ", "sinh viên đỏ",
    "critical students", "thằng học yếu nhất", "đứa học yếu nhất", "ai học yếu nhất", "cứu gấp",
    "ai dễ rớt nhất", "sv nào nguy hiểm", "top risk", "top nguy cơ", "high risk",
    "danh sách đỏ", "báo động đỏ", "sv yếu nhất", "top sinh viên yếu", "top sv yếu",
    "ai rủi ro", "sinh viên nguy hiểm", "ai đang critical"
  ];
  if (highRiskKeywords.some(kw => msgLower.includes(kw))) {
    return 'HIGH_RISK_STUDENTS_INTENT';
  }

  // Class analytics
  const classKeywords = [
    "tình hình lớp", "phân tích lớp", "thống kê lớp", "tình hình toàn lớp",
    "sức khỏe học thuật của lớp", "tình hình chung", "overview lớp", "dashboard lớp",
    "tổng quan lớp", "báo cáo lớp", "thống kê chung", "dashboard", "overview",
    "bao nhiêu sv risk", "tình hình học tập", "thống kê toàn bộ"
  ];
  if (classKeywords.some(kw => msgLower.includes(kw))) {
    return 'CLASS_ANALYTICS_INTENT';
  }

  // System info
  const systemKeywords = [
    "hệ thống hoạt động thế nào", "thuật toán gì", "pearson", "regression", 
    "explainable ai", "kiến trúc", "hybrid", "mô hình phân tích chuỗi",
    "hoạt động như thế nào", "technology stack", "system architecture"
  ];
  if (systemKeywords.some(kw => msgLower.includes(kw))) {
    return 'GENERAL_SYSTEM_INTENT';
  }

  // Follow-up intents (only when active student exists)
  const followupKeywords = {
    ROOT_CAUSE: ["nguyên nhân", "vì sao", "tại sao", "giải thích risk", "tại sao nó đỏ", "giải thích chỉ số risk", "root cause", "xai", "lý do"],
    ATTENDANCE: ["chuyên cần", "vắng", "nghỉ", "đi học", "điểm danh", "cấm thi", "attendance"],
    INTERVENTION: ["can thiệp", "giải pháp", "khắc phục", "hỗ trợ", "cứu", "phụ đạo", "lộ trình can thiệp", "kế hoạch cứu", "roadmap"],
    TIMELINE: ["timeline", "lộ trình học tập", "nếu rớt môn", "nếu trượt môn", "nếu tạch môn", "ảnh hưởng môn"],
    STRENGTH: ["điểm mạnh", "thế mạnh", "môn nào giỏi", "học tốt", "điểm sáng"]
  };

  for (const [intentName, keywords] of Object.entries(followupKeywords)) {
    if (keywords.some(kw => msgLower.includes(kw))) {
      return `FOLLOWUP_${intentName}_INTENT`;
    }
  }

  // Student analysis (detect by action verbs or contextual phrases)
  const contextualPhrases = [
    "em đó", "bạn đó", "sinh viên này", "em này", "bạn này", 
    "sinh viên đó", "đứa đó", "đứa này", "thằng này", "nó"
  ];
  const studentKeywords = ["phân tích sinh viên", "risk score của", "gpa của", "phân tích", "đánh giá", "xem nguy cơ", "khả năng qua môn", "hồ sơ", "check sv"];
  const hasContextualPhrase = contextualPhrases.some(kw => msgLower.includes(kw));
  const hasStudentAction = studentKeywords.some(kw => msgLower.includes(kw));

  if (hasStudentAction || (hasContextualPhrase && activeStudent)) {
    return 'STUDENT_ANALYTICS_INTENT';
  }

  return 'FALLBACK_INTENT';
}

module.exports = {
  routeIntent
};
