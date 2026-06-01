const { fetchStudentByMssv, fetchAllStudents } = require('../../repositories/studentRepository');
const { 
  calculateBaseRisk,
  explainRisk,
  getPriorityList,
  compareStudents,
  forecastTrend,
  simulateScenario,
  generateRecommendations,
  logAction,
  generateAcademicTimeline, 
  computeClassAnalytics
} = require('../../ai/engines/index');
const appLogger = require('../../infrastructure/logger');

// ════════════════════════════════════════════
// CORE DECISION ROUTER (ORCHESTRATOR)
// ════════════════════════════════════════════
async function executeDecision({ intent, activeMssv, entities, session, user = 'System' }) {
  appLogger.info(`[DSS_DECISION] Executing intent: ${intent} | MSSV Context: ${activeMssv || 'none'}`);
  
  // Audit log every incoming request
  logAction({ user, action: intent, target: activeMssv || 'Global', context: entities });

  switch (intent) {
    // ----------------------------------------------------
    // LEVEL 1: ANALYTICS
    // ----------------------------------------------------
    case 'STUDENT_ANALYTICS_INTENT': {
      const mssv = activeMssv || entities.mssv;
      if (!mssv) return { type: 'NEED_MSSV' };
      const student = await fetchStudentByMssv(mssv);
      if (!student) return { type: 'STUDENT_NOT_FOUND', mssv };
      
      const riskData = explainRisk(student);
      const timeline = generateAcademicTimeline(student, riskData);
      return { type: 'STUDENT_ANALYTICS', student, riskData, timeline };
    }

    case 'CLASS_ANALYTICS_INTENT':
    case 'RISK_SCAN_INTENT': {
      const students = await fetchAllStudents();
      const analytics = computeClassAnalytics(students);
      return { type: 'CLASS_ANALYTICS', analytics };
    }

    // ----------------------------------------------------
    // LEVEL 2: EXPLANATION (XAI)
    // ----------------------------------------------------
    case 'ROOT_CAUSE_XAI_INTENT': {
      const mssv = activeMssv || entities.mssv;
      if (!mssv) return { type: 'NEED_ACTIVE_STUDENT' };
      const student = await fetchStudentByMssv(mssv);
      if (!student) return { type: 'STUDENT_NOT_FOUND', mssv };
      
      const riskData = explainRisk(student);
      const timeline = generateAcademicTimeline(student, riskData);
      return { type: 'FOLLOWUP_ROOT_CAUSE', followupType: 'ROOT_CAUSE', student, riskData, timeline };
    }

    case 'ATTENDANCE_ANALYSIS_INTENT': {
      const mssv = activeMssv || entities.mssv;
      if (!mssv) return { type: 'NEED_ACTIVE_STUDENT' };
      const student = await fetchStudentByMssv(mssv);
      if (!student) return { type: 'STUDENT_NOT_FOUND', mssv };
      
      const riskData = explainRisk(student);
      const timeline = generateAcademicTimeline(student, riskData);
      return { type: 'FOLLOWUP_ATTENDANCE', followupType: 'ATTENDANCE', student, riskData, timeline };
    }

    // ----------------------------------------------------
    // LEVEL 3: PREDICTION (WHAT-IF)
    // ----------------------------------------------------
    case 'PREDICT_FUTURE_INTENT': {
      const mssv = activeMssv || entities.mssv;
      if (!mssv) return { type: 'NEED_ACTIVE_STUDENT' };
      const student = await fetchStudentByMssv(mssv);
      if (!student) return { type: 'STUDENT_NOT_FOUND', mssv };
      
      const timeframe = entities.timeframe || '4 tuần';
      const forecast = forecastTrend(student, timeframe);
      return { type: 'FORECAST_TREND', student, timeframe, forecast };
    }

    case 'SCENARIO_SIMULATION_INTENT': {
      const mssv = activeMssv || entities.mssv;
      if (!mssv) return { type: 'NEED_ACTIVE_STUDENT' };
      const student = await fetchStudentByMssv(mssv);
      if (!student) return { type: 'STUDENT_NOT_FOUND', mssv };
      
      let mode = 'SCORE';
      let value = 8.0;
      let additionalValue = null;

      // Detect Recovery Scenario (both attendance and score provided)
      if (entities.attendance_range && entities.score) {
        mode = 'RECOVERY_SCENARIO';
        value = parseInt(entities.attendance_range);
        additionalValue = parseFloat(entities.score);
      } else if (entities.attendance_range) {
        mode = 'ATTENDANCE';
        value = parseInt(entities.attendance_range);
      } else if (entities.subject) {
        mode = 'FAIL_SUBJECT';
        value = entities.subject;
      } else if (entities.score) {
        value = parseFloat(entities.score);
      }

      const scenario = simulateScenario(student, mode, value, additionalValue);
      return { type: 'SCENARIO_SIMULATION', student, mode, value, additionalValue, scenario };
    }

    // ----------------------------------------------------
    // LEVEL 4 & 5: DECISION & ACTION
    // ----------------------------------------------------
    case 'PRIORITY_ENGINE_INTENT': {
      const students = await fetchAllStudents();
      const priorityList = getPriorityList(students, entities.topN || 5);
      return { type: 'PRIORITY_RANKING', priorityList };
    }

    case 'COMPARE_STUDENTS_INTENT': {
      const mssvs = Array.isArray(entities.mssv) ? entities.mssv : [activeMssv, entities.mssv].filter(Boolean);
      if (mssvs.length < 2) return { type: 'NEED_TWO_MSSV', found: mssvs };
      
      const s1 = await fetchStudentByMssv(mssvs[0]);
      const s2 = await fetchStudentByMssv(mssvs[1]);
      if (!s1 || !s2) return { type: 'STUDENT_NOT_FOUND', query: mssvs.join(',') };
      
      const comparison = compareStudents(s1, s2);
      return { type: 'COMPARE_STUDENTS', comparison };
    }

    case 'INTERVENTION_REC_INTENT': {
      const mssv = activeMssv || entities.mssv;
      if (!mssv) return { type: 'NEED_ACTIVE_STUDENT' };
      const student = await fetchStudentByMssv(mssv);
      if (!student) return { type: 'STUDENT_NOT_FOUND', mssv };
      
      const riskData = explainRisk(student);
      const timeline = generateAcademicTimeline(student, riskData);
      return { type: 'FOLLOWUP_INTERVENTION', followupType: 'INTERVENTION', student, riskData, timeline };
    }
    
    default:
      return { type: 'FALLBACK', hasActiveStudent: !!activeMssv, activeMssv };
  }
}

module.exports = {
  executeDecision
};
