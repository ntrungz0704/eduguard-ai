const { extractMssv } = require('./entityExtractor');

/**
 * Intent Router v3.0 — The DSS Router
 * Maps NLP intents to Backend Engine constants.
 */
function routeIntent(msg, nlpIntent = 'None', activeStudent = null, entities = []) {
  const msgLower = (msg || '').toLowerCase().trim();

  // STEP 1: Direct NLP Mapping (The DSS 14 Core Intents)
  const NLP_INTENT_MAP = {
    // LEVEL 1: ANALYTICS
    'query.student': 'STUDENT_ANALYTICS_INTENT',
    'query.class': 'CLASS_ANALYTICS_INTENT',
    'query.subject': 'SUBJECT_ANALYSIS_INTENT',
    'query.attendance': 'ATTENDANCE_ANALYSIS_INTENT',
    'query.risk': 'RISK_SCAN_INTENT',

    // LEVEL 2: EXPLANATION
    'query.xai': 'ROOT_CAUSE_XAI_INTENT',
    'query.prerequisite': 'PREREQUISITE_IMPACT_INTENT',
    'query.impact': 'IMPACT_ANALYSIS_INTENT',

    // LEVEL 3: PREDICTION
    'query.predict_future': 'PREDICT_FUTURE_INTENT',
    'query.scenario': 'SCENARIO_SIMULATION_INTENT',

    // LEVEL 4: DECISION
    'query.priority': 'PRIORITY_ENGINE_INTENT',
    'query.intervention': 'INTERVENTION_REC_INTENT',
    'query.compare_students': 'COMPARE_STUDENTS_INTENT',

    // LEVEL 5: ACTION
    'query.generate_message': 'GENERATE_MESSAGE_INTENT',

    // LEVEL 6: KNOWLEDGE
    'career.path': 'CAREER_PATH_INTENT',
    'knowledge.risk_chain': 'RISK_CHAIN_INTENT',
    'query.explain_model': 'EXPLAIN_MODEL_INTENT',

    // UTILS
    'greeting': 'GREETING_INTENT',
    'query.out_of_scope': 'OUT_OF_SCOPE_INTENT'
  };

  let intent = NLP_INTENT_MAP[nlpIntent] || 'FALLBACK_INTENT';

  // STEP 2: Entity-First Priority Detection
  // If the user mentions exactly 2 MSSVs, it MUST be a comparison (even if NLP failed)
  const mssvMatches = msgLower.match(/[a-z]{2}\d{5}/g) || [];
  if (mssvMatches.length === 2) {
    intent = 'COMPARE_STUDENTS_INTENT';
    console.log(`[AI_ROUTER] Detected 2 MSSVs → Forcing COMPARE_STUDENTS_INTENT`);
  } else if (mssvMatches.length === 1 && intent === 'FALLBACK_INTENT') {
    intent = 'STUDENT_ANALYTICS_INTENT';
    console.log(`[AI_ROUTER] Detected 1 MSSV as fallback → STUDENT_ANALYTICS_INTENT`);
  }

  // STEP 3: Legacy Keyword Fallbacks for safety
  if (intent === 'FALLBACK_INTENT') {
    intent = keywordHeuristicRoute(msgLower, activeStudent);
  }

  console.log(`[AI_ROUTER] Routed Intent: ${intent} | Message: "${msg}" | NLP: ${nlpIntent}`);
  return intent;
}

function keywordHeuristicRoute(msgLower, activeStudent) {
  if (msgLower.includes('so sánh')) return 'COMPARE_STUDENTS_INTENT';
  if (msgLower.includes('khẩn cấp') || msgLower.includes('ai cần cứu')) return 'PRIORITY_ENGINE_INTENT';
  if (msgLower.includes('dự báo') || msgLower.includes('tương lai') || msgLower.includes('timeline') || msgLower.includes('lộ trình học tập')) return 'PREDICT_FUTURE_INTENT';
  if (msgLower.includes('nếu') || msgLower.includes('giả lập') || msgLower.includes('mô phỏng')) return 'SCENARIO_SIMULATION_INTENT';
  if (msgLower.includes('nguyên nhân') || msgLower.includes('vì sao') || msgLower.includes('tại sao') || msgLower.includes('lý do')) return 'ROOT_CAUSE_XAI_INTENT';
  if (msgLower.includes('can thiệp') || msgLower.includes('cứu') || msgLower.includes('lộ trình')) return 'INTERVENTION_REC_INTENT';
  if (msgLower.includes('chuyên cần') || msgLower.includes('điểm danh') || msgLower.includes('vắng')) return 'ATTENDANCE_ANALYSIS_INTENT';
  if (msgLower.includes('muốn theo') || msgLower.includes('backend') || msgLower.includes('frontend')) return 'CAREER_PATH_INTENT';
  if (msgLower.includes('ảnh hưởng môn nào')) return 'RISK_CHAIN_INTENT';
  if (msgLower.includes('thuật toán') || msgLower.includes('pearson') || msgLower.includes('hoạt động thế nào') || msgLower.includes('ols') || msgLower.includes('iqr') || msgLower.includes('hệ thống hoạt động')) return 'EXPLAIN_MODEL_INTENT';
  if (msgLower.includes('tình hình lớp') || msgLower.includes('tổng quan') || msgLower.includes('thống kê')) return 'CLASS_ANALYTICS_INTENT';
  if (msgLower.includes('môn dễ rớt') || msgLower.includes('nút thắt')) return 'CLASS_ANALYTICS_INTENT'; // Fallback to class analytics if no specific intent
  
  return 'FALLBACK_INTENT';
}

module.exports = {
  routeIntent
};
