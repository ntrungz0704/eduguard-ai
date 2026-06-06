// ============================================================
// EduGuard AI — Student Intent Router
// Routes intents when the user is a STUDENT
// ============================================================

function routeStudentIntent(msg, nlpIntent = 'None') {
  const msgLower = (msg || '').toLowerCase().trim();

  // Basic greeting fallback
  const greetingKeywords = ["hello", "hi", "helo", "alo", "xin chào", "chào"];
  let intent = 'STUDENT_FALLBACK_INTENT';

  // Direct mapping from NLP
  if (nlpIntent === 'greeting' || greetingKeywords.some(kw => msgLower === kw || msgLower.startsWith(kw + ' ') || msgLower.endsWith(' ' + kw))) {
    intent = 'STUDENT_GREETING_INTENT';
  } else if (nlpIntent === 'student.overview' || nlpIntent === 'student.analysis') {
    intent = 'STUDENT_OVERVIEW_INTENT';
  } else if (nlpIntent === 'student.risk') {
    intent = 'STUDENT_RISK_INTENT';
  } else if (nlpIntent === 'career.path') {
    intent = 'STUDENT_CAREER_PATH_INTENT';
  } else if (nlpIntent === 'knowledge.risk_chain') {
    intent = 'STUDENT_RISK_CHAIN_INTENT';
  } else if (nlpIntent === 'student.recommendation') {
    intent = 'STUDENT_RECOMMENDATION_INTENT';
  } else if (nlpIntent === 'student.motivation') {
    intent = 'STUDENT_MOTIVATION_INTENT';
  } else if (nlpIntent === 'student.gpa_simulation') {
    intent = 'STUDENT_GPA_SIMULATION_INTENT';
  } else if (nlpIntent === 'student.progress') {
    intent = 'STUDENT_PROGRESS_INTENT';
  } else if (nlpIntent === 'syllabus.course.info') {
    intent = 'STUDENT_SYLLABUS_INFO_INTENT';
  } else if (nlpIntent === 'syllabus.prerequisite') {
    intent = 'STUDENT_SYLLABUS_PREREQ_INTENT';
  } else if (nlpIntent === 'intervention.reason') {
    intent = 'STUDENT_INTERVENTION_REASON_INTENT';
  } else if (nlpIntent === 'student.roadmap') {
    intent = 'STUDENT_ROADMAP_INTENT';
  }

  // Heuristics fallback if NLP failed
  if (intent === 'STUDENT_FALLBACK_INTENT') {
    if (msgLower.includes('nên theo ngành gì') || msgLower.includes('hợp với nghề gì') || msgLower.includes('nghề nào phù hợp') || msgLower.includes('gợi ý nghề')) {
      intent = 'STUDENT_BEST_CAREER_INTENT';
    } else if (msgLower.includes('tại sao') && (msgLower.includes('hợp') || msgLower.includes('thích hợp') || msgLower.includes('phù hợp') || msgLower.includes('lại match'))) {
      intent = 'STUDENT_CAREER_REASON_INTENT';
    } else if ((msgLower.includes('làm sao') || msgLower.includes('cách nào')) && msgLower.includes('thực tập')) {
      intent = 'STUDENT_INTERNSHIP_PLAN_INTENT';
    } else if (msgLower.includes('kế hoạch 90 ngày') || msgLower.includes('tạo kế hoạch') || msgLower.includes('90-day plan') || msgLower.includes('12 tuần')) {
      intent = 'STUDENT_90_DAY_PLAN_INTENT';
    } else if (msgLower.includes('tình hình') || msgLower.includes('gpa') || msgLower.includes('phân tích')) {
      intent = 'STUDENT_OVERVIEW_INTENT';
    } else if (msgLower.includes('rớt') || msgLower.includes('nguy hiểm') || msgLower.includes('tạch')) {
      intent = 'STUDENT_RISK_INTENT';
    } else if (msgLower.includes('muốn theo') || msgLower.includes('backend') || msgLower.includes('frontend') || msgLower.includes('lộ trình')) {
      intent = 'STUDENT_CAREER_PATH_INTENT';
    } else if (msgLower.includes('ảnh hưởng môn nào') || msgLower.includes('kéo theo')) {
      intent = 'STUDENT_RISK_CHAIN_INTENT';
    } else if (msgLower.includes('cải thiện') || msgLower.includes('học gì')) {
      intent = 'STUDENT_RECOMMENDATION_INTENT';
    } else if (msgLower.includes('stress') || msgLower.includes('ngu') || msgLower.includes('cứu')) {
      intent = 'STUDENT_MOTIVATION_INTENT';
    } else if (msgLower.includes('môn học') || msgLower.includes('đề cương') || msgLower.includes('học cái gì')) {
      intent = 'STUDENT_SYLLABUS_INFO_INTENT';
    } else if (msgLower.includes('môn tiên quyết') || msgLower.includes('học môn gì trước')) {
      intent = 'STUDENT_SYLLABUS_PREREQ_INTENT';
    } else if (msgLower.includes('tại sao') && (msgLower.includes('cảnh báo') || msgLower.includes('rủi ro'))) {
      intent = 'STUDENT_INTERVENTION_REASON_INTENT';
    }
  }

  console.log(`[STUDENT_ROUTER] Routed Intent: ${intent} | Message: "${msg}" | NLP: ${nlpIntent}`);
  return intent;
}

module.exports = {
  routeStudentIntent
};
