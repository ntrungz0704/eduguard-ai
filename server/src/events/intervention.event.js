const eventBus = require('./eventBus');
const appLogger = require('../infrastructure/logger');

// ============================================================
// Intervention Event Handlers
// ============================================================

eventBus.on('PREREQUISITE_BREAK_EVENT', (payload) => {
  appLogger.warn(`[INTERVENTION_MONITOR] Prerequisite break: ${payload.mssv} | Courses: ${payload.failedCourses}`);
  // Future: auto-create intervention record, notify advisor
});

eventBus.on('INTERVENTION_NEEDED_EVENT', (payload) => {
  appLogger.warn(`[INTERVENTION_MONITOR] Intervention needed: ${payload.mssv} at ${payload.riskLevel}`);
});

eventBus.on('INTERVENTION_CREATED_EVENT', (payload) => {
  appLogger.info(`[INTERVENTION_MONITOR] Created: ${payload.mssv} | Course: ${payload.courseId} | Advisor: ${payload.advisorId}`);
});

/**
 * Evaluate prerequisite failures and emit intervention events
 * @param {string} mssv
 * @param {Array} failedCourses - Array of failed course objects
 * @param {string} riskLevel
 */
function checkAndEmitIntervention(mssv, failedCourses, riskLevel) {
  if (failedCourses.length > 0) {
    const foundationalFails = failedCourses.filter(c => {
      const match = (c.courseId || '').match(/\d+/);
      return match && parseInt(match[0]) <= 200;
    });
    if (foundationalFails.length > 0) {
      eventBus.emitPrerequisiteBreak(mssv, foundationalFails);
    }
  }

  if (riskLevel === 'HIGH' || riskLevel === 'CRITICAL') {
    eventBus.emitInterventionNeeded(mssv, riskLevel);
  }
}

module.exports = {
  checkAndEmitIntervention
};
