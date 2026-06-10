// ============================================================
// EduGuard AI — Student Intent Router
// Routes intents when the user is a STUDENT
// ============================================================

const { getSession } = require('./sessionMemory');

function routeStudentIntent(msg, nlpIntent = 'None', sessionId = null) {
  const msgLower = (msg || '').toLowerCase().trim();

  // Retrieve session brain context if available
  let brain = null;
  if (sessionId) {
    const session = getSession(sessionId, 'STUDENT');
    if (session && session.brain) {
      brain = session.brain;
    }
  }

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
  } else if (nlpIntent === 'student.timeline') {
    intent = 'STUDENT_TIMELINE_INTENT';
  } else if (nlpIntent === 'query.explain_model') {
    intent = 'EXPLAIN_MODEL_INTENT';
  } else if (nlpIntent === 'syllabus.course.info') {
    intent = 'STUDENT_SYLLABUS_INFO_INTENT';
  } else if (nlpIntent === 'syllabus.prerequisite') {
    intent = 'STUDENT_SYLLABUS_PREREQ_INTENT';
  } else if (nlpIntent === 'skill.definition') {
    intent = 'skill.definition';
  } else if (nlpIntent === 'skill.prerequisite') {
    intent = 'skill.prerequisite';
  } else if (nlpIntent === 'skill.compare') {
    intent = 'skill.compare';
  } else if (nlpIntent === 'skill.roadmap') {
    intent = 'skill.roadmap';
  } else if (nlpIntent === 'intervention.reason') {
    intent = 'STUDENT_INTERVENTION_REASON_INTENT';
  } else if (nlpIntent === 'student.roadmap') {
    intent = 'STUDENT_ROADMAP_INTENT';
  }

  // Career keywords for all 18 paths (used in heuristic detection below)
  const careerKeywords = [
    'frontend', 'front-end', 'backend', 'back-end', 'fullstack', 'full-stack', 'full stack',
    'react native', 'react developer', 'next.js', 'nextjs', 'node.js', 'nodejs',
    'flutter', 'dart', 'devops', 'dev ops', 'cloud', 'qa automation', 'qa auto',
    'prompt engineer', 'software engineer', 'software architect', 'solutions engineer',
    'ui engineer', 'ai fullstack', 'ai frontend', 'ai full',
    'kỹ sư phần mềm', 'kiến trúc sư', 'kỹ sư giải pháp'
  ];
  const hasCareerKeyword = careerKeywords.some(kw => msgLower.includes(kw));

  // Context-Aware Intent Resolution (Student Brain Memory)
  if (intent === 'STUDENT_FALLBACK_INTENT' && brain) {
    // If student asks vague questions like "còn thiếu gì?", "học tiếp gì?"
    // And we know their career goal -> Route to Skill Gap
    if (brain.careerGoal && (msgLower.includes('thiếu') || msgLower.includes('cần học') || msgLower.includes('skill gap') || msgLower.includes('lỗ hổng'))) {
      intent = 'STUDENT_SKILL_GAP_INTENT';
      console.log(`[STUDENT_ROUTER] Brain resolved: Vague skill gap request -> STUDENT_SKILL_GAP_INTENT (context: ${brain.careerGoal})`);
    }

    // If student asks "nên làm dự án gì?"
    // And we know their career goal -> Route to Portfolio
    else if (brain.careerGoal && (msgLower.includes('dự án') || msgLower.includes('project') || msgLower.includes('portfolio'))) {
      intent = 'STUDENT_PORTFOLIO_INTENT';
      console.log(`[STUDENT_ROUTER] Brain resolved: Vague portfolio request -> STUDENT_PORTFOLIO_INTENT (context: ${brain.careerGoal})`);
    }

    // If student says "học gì tiếp theo" and last topic was ROADMAP
    else if (brain.lastTopic === 'ROADMAP' && (msgLower.includes('tiếp theo') || msgLower.includes('học gì'))) {
      intent = 'STUDENT_ROADMAP_INTENT';
      console.log(`[STUDENT_ROUTER] Brain resolved: Follow-up roadmap request -> STUDENT_ROADMAP_INTENT (context: ${brain.lastTopic})`);
    }
  }

  // Heuristics fallback if NLP and Context failed
  if (intent === 'STUDENT_FALLBACK_INTENT') {
    // Direct numeric routing based on menu options
    const numMatch = msgLower.match(/^(?:số|chọn|phím)?\s*([1-7])\b/);
    if (numMatch) {
      const option = parseInt(numMatch[1], 10);
      switch (option) {
        case 1: intent = 'STUDENT_SYLLABUS_INFO_INTENT'; break;
        case 2: intent = 'STUDENT_RISK_INTENT'; break;
        case 3: intent = 'STUDENT_GPA_SIMULATION_INTENT'; break;
        case 4: intent = 'STUDENT_CAREER_PATH_INTENT'; break;
        case 5: intent = 'STUDENT_SKILL_GAP_INTENT'; break;
        case 6: intent = 'STUDENT_PORTFOLIO_INTENT'; break;
        case 7: intent = 'STUDENT_90_DAY_PLAN_INTENT'; break;
      }
      console.log(`[STUDENT_ROUTER] Numeric shortcut ${option} mapped to ${intent}`);
      return intent;
    }

    // Tech/Skill Explain intent
    const technologies = require('../../data/knowledge/technologies.json');
    const hasTechKeyword = technologies.some(tech => 
      tech.aliases.some(alias => msgLower.includes(alias)) || msgLower.includes(tech.name.toLowerCase())
    );
    if (hasTechKeyword && (msgLower.includes('là gì') || msgLower.includes('học') || msgLower.includes('như thế nào') || msgLower.includes('giải thích'))) {
      intent = 'STUDENT_TECH_EXPLAIN_INTENT';
      console.log(`[STUDENT_ROUTER] Detected TECH_EXPLAIN via heuristics.`);
      return intent;
    }

    // Skill Gap intent
    if (msgLower.includes('skill gap') || msgLower.includes('lỗ hổng') || msgLower.includes('kỹ năng còn thiếu') ||
        msgLower.includes('em thiếu gì') || msgLower.includes('thiếu kỹ năng') || msgLower.includes('kiến thức thiếu') ||
        msgLower.includes('cần học thêm gì') || msgLower.includes('kỹ năng nào cần') || msgLower.includes('gap') ||
        (msgLower.includes('thiếu') && hasCareerKeyword)) {
      intent = 'STUDENT_SKILL_GAP_INTENT';
    }
    // Portfolio intent
    else if (msgLower.includes('portfolio') || msgLower.includes('dự án cá nhân') || msgLower.includes('project cần làm') ||
             msgLower.includes('nên làm dự án gì') || msgLower.includes('gợi ý dự án') || msgLower.includes('gợi ý project') ||
             msgLower.includes('làm dự án') || msgLower.includes('xây dựng portfolio') || msgLower.includes('tạo portfolio')) {
      intent = 'STUDENT_PORTFOLIO_INTENT';
    }
    // Best career suggestion
    else if (msgLower.includes('nên theo ngành gì') || msgLower.includes('hợp với nghề gì') || msgLower.includes('nghề nào phù hợp') ||
             msgLower.includes('gợi ý nghề') || msgLower.includes('phù hợp nghề nào') || msgLower.includes('ngành nào tốt') ||
             msgLower.includes('nghề gì hay') || msgLower.includes('hướng đi nào')) {
      intent = 'STUDENT_BEST_CAREER_INTENT';
    }
    // Career reason
    else if (msgLower.includes('tại sao') && (msgLower.includes('hợp') || msgLower.includes('thích hợp') || msgLower.includes('phù hợp') || msgLower.includes('lại match'))) {
      intent = 'STUDENT_CAREER_REASON_INTENT';
    }
    // Internship plan
    else if ((msgLower.includes('làm sao') || msgLower.includes('cách nào')) && msgLower.includes('thực tập')) {
      intent = 'STUDENT_INTERNSHIP_PLAN_INTENT';
    }
    // 90-day plan
    else if (msgLower.includes('kế hoạch 90 ngày') || msgLower.includes('tạo kế hoạch') || msgLower.includes('90-day plan') ||
             msgLower.includes('12 tuần') || msgLower.includes('lên kế hoạch') || msgLower.includes('plan 90') ||
             msgLower.includes('kế hoạch học')) {
      intent = 'STUDENT_90_DAY_PLAN_INTENT';
    }
    // Timeline
    else if (msgLower.includes('timeline') || msgLower.includes('lộ trình học tập') || msgLower.includes('khung thời gian') || msgLower.includes('academic timeline')) {
      intent = 'STUDENT_TIMELINE_INTENT';
    }
    // Explain model
    else if (msgLower.includes('thuật toán') || msgLower.includes('pearson') || msgLower.includes('hoạt động thế nào') || msgLower.includes('ols') || msgLower.includes('iqr') || msgLower.includes('hệ thống hoạt động')) {
      intent = 'EXPLAIN_MODEL_INTENT';
    }
    // Overview
    else if (msgLower.includes('tình hình') || msgLower.includes('gpa') || msgLower.includes('phân tích') || msgLower.includes('điểm số')) {
      intent = 'STUDENT_OVERVIEW_INTENT';
    }
    // Risk
    else if (msgLower.includes('rớt') || msgLower.includes('nguy hiểm') || msgLower.includes('tạch') || msgLower.includes('rủi ro')) {
      intent = 'STUDENT_RISK_INTENT';
    }
    // Career path (broad — any career keyword + intent words)
    else if (hasCareerKeyword || msgLower.includes('muốn theo') || msgLower.includes('lộ trình') || msgLower.includes('roadmap')) {
      intent = 'STUDENT_CAREER_PATH_INTENT';
    }
    // Risk chain
    else if (msgLower.includes('ảnh hưởng môn nào') || msgLower.includes('kéo theo')) {
      intent = 'STUDENT_RISK_CHAIN_INTENT';
    }
    // Recommendation
    else if (msgLower.includes('cải thiện') || msgLower.includes('học gì')) {
      intent = 'STUDENT_RECOMMENDATION_INTENT';
    }
    // Motivation
    else if (msgLower.includes('stress') || msgLower.includes('ngu') || msgLower.includes('cứu') || msgLower.includes('chán') || msgLower.includes('bỏ học')) {
      intent = 'STUDENT_MOTIVATION_INTENT';
    }
    // Syllabus
    else if (msgLower.includes('môn học') || msgLower.includes('đề cương') || msgLower.includes('học cái gì')) {
      intent = 'STUDENT_SYLLABUS_INFO_INTENT';
    }
    else if (msgLower.includes('môn tiên quyết') || msgLower.includes('học môn gì trước')) {
      intent = 'STUDENT_SYLLABUS_PREREQ_INTENT';
    }
    // Intervention reason
    else if (msgLower.includes('tại sao') && (msgLower.includes('cảnh báo') || msgLower.includes('rủi ro'))) {
      intent = 'STUDENT_INTERVENTION_REASON_INTENT';
    }
  }

  console.log(`[STUDENT_ROUTER] Routed Intent: ${intent} | Message: "${msg}" | NLP: ${nlpIntent}`);
  return intent;
}

module.exports = {
  routeStudentIntent
};
