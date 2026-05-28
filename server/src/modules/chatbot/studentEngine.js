// ============================================================
// EduGuard AI — Student Decision Engine
// Copilot engine specifically for students (Motivation, GPA, Planning)
// ============================================================

const { fetchStudent } = require('./aiDecisionEngine');
const { calculateExplainableRisk } = require('../../ai/dssEngine');

async function executeStudentDecision({ intent, activeMssv, session }) {
  if (!activeMssv) {
    return { type: 'NEED_LOGIN' };
  }

  const student = await fetchStudent(activeMssv);
  if (!student) {
    return { type: 'STUDENT_NOT_FOUND', mssv: activeMssv };
  }

  const riskData = calculateExplainableRisk(student);

  switch (intent) {
    case 'STUDENT_OVERVIEW_INTENT':
    case 'STUDENT_PROGRESS_INTENT':
      return {
        type: 'STUDENT_OVERVIEW',
        student,
        riskData
      };

    case 'STUDENT_RISK_INTENT':
      return {
        type: 'STUDENT_RISK',
        student,
        riskData
      };

    case 'STUDENT_RECOMMENDATION_INTENT':
      return {
        type: 'STUDENT_RECOMMENDATION',
        student,
        riskData
      };

    case 'STUDENT_MOTIVATION_INTENT':
      return {
        type: 'STUDENT_MOTIVATION',
        student,
        riskData
      };

    case 'STUDENT_GPA_SIMULATION_INTENT':
      return {
        type: 'STUDENT_GPA_SIMULATION',
        student,
        riskData
      };

    case 'STUDENT_GREETING_INTENT':
      return { type: 'STUDENT_GREETING' };

    case 'SYLLABUS_INTENT':
      return { type: 'SYLLABUS_INFO', student };

    case 'STUDENT_FALLBACK_INTENT':
    default:
      return { type: 'STUDENT_FALLBACK', activeMssv };
  }
}

module.exports = {
  executeStudentDecision
};
