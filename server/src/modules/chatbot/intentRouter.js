const { extractMssv } = require('./entityExtractor');

function routeIntent(msg, nlpIntent = 'None', activeStudent = null) {
  const msgLower = (msg || '').toLowerCase().trim();

  // Keyword categories
  const greetingKeywords = ["hello", "hi", "helo", "alo", "bạn làm được gì", "help", "xin chào", "chào", "trợ giúp"];
  const classKeywords = [
    "ai cần can thiệp", "sinh viên nguy cơ cao", "tình hình lớp", "bottleneck", 
    "môn dễ fail", "môn kéo gpa", "top sinh viên rủi ro", "phân tích lớp", 
    "thống kê lớp", "tình hình toàn lớp", "danh sách sinh viên nguy cơ",
    "môn nào dễ trượt", "sinh viên học lực yếu", "thống kê danh sách"
  ];
  const systemKeywords = [
    "hệ thống hoạt động thế nào", "thuật toán gì", "pearson", "regression", 
    "explainable ai", "dependency graph", "kiến trúc", "hybrid", "mô hình phân tích chuỗi",
    "hoạt động như thế nào", "tổng quan chương trình đào tạo", "bao nhiêu môn học"
  ];
  const studentKeywords = ["phân tích sinh viên", "risk score của", "gpa của", "phân tích"];
  
  const followupKeywords = {
    ROOT_CAUSE: ["nguyên nhân", "vì sao", "tại sao", "rủi ro", "hổng", "mất gốc", "lý do"],
    ATTENDANCE: ["chuyên cần", "vắng", "nghỉ", "đi học", "điểm danh", "cấm thi"],
    INTERVENTION: ["can thiệp", "giải pháp", "khắc phục", "hỗ trợ", "cứu", "phụ đạo"],
    TIMELINE: ["timeline", "lộ trình", "nếu rớt", "nếu trượt", "nếu tạch", "ảnh hưởng", "chuỗi"],
    STRENGTH: ["điểm mạnh", "thế mạnh", "môn nào giỏi", "học tốt", "thế mạnh", "điểm sáng"]
  };

  let intent = 'FALLBACK_INTENT';

  // Direct mapping from NLP
  if (nlpIntent === 'greeting') {
    intent = 'GREETING_INTENT';
  } else if (nlpIntent === 'query.statistics' || nlpIntent === 'CLASS_ANALYTICS') {
    intent = 'CLASS_ANALYTICS_INTENT';
  } else if (nlpIntent === 'query.system_info') {
    intent = 'GENERAL_SYSTEM_INTENT';
  } else if (nlpIntent === 'query.academic_performance' || nlpIntent === 'query.risk_warning') {
    intent = 'STUDENT_ANALYTICS_INTENT';
  } else if (nlpIntent === 'query.recommendation' || nlpIntent === 'query.learning_path') {
    intent = 'FOLLOWUP_INTERVENTION_INTENT';
  } else if (nlpIntent === 'query.bottleneck') {
    intent = 'CLASS_ANALYTICS_INTENT'; // Fallback to class analytics which has bottleneck data
  } else if (nlpIntent === 'query.trend') {
    intent = 'CLASS_ANALYTICS_INTENT';
  } else if (nlpIntent === 'query.followup') {
    intent = 'STUDENT_ANALYTICS_INTENT'; // Let context resolver handle the exact student
  } else if (nlpIntent === 'query.syllabus' || nlpIntent === 'student.syllabus') {
    intent = 'SYLLABUS_INTENT';
  } 
  
  // If no direct map or fallback, try heuristics
  if (intent === 'FALLBACK_INTENT') {
    if (greetingKeywords.some(kw => msgLower === kw || msgLower.startsWith(kw + ' ') || msgLower.endsWith(' ' + kw))) {
      intent = 'GREETING_INTENT';
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
        if (hasMssv || studentKeywords.some(kw => msgLower.includes(kw))) {
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
