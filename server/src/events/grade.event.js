const eventBus = require('./eventBus');
const appLogger = require('../infrastructure/logger');

// ============================================================
// Grade Event Handlers
// ============================================================

eventBus.on('GRADE_FAIL_EVENT', (payload) => {
  appLogger.warn(`[GRADE_MONITOR] Fail detected: ${payload.mssv} | ${payload.courseId} | Score: ${payload.score}`);
});

eventBus.on('GRADE_RECOVERY_EVENT', (payload) => {
  appLogger.info(`[GRADE_MONITOR] Recovery: ${payload.mssv} | ${payload.courseId} | New Score: ${payload.newScore}`);
});

/**
 * Evaluate grade and emit events
 * @param {string} mssv
 * @param {string} courseId
 * @param {number} score
 */
function checkAndEmitGrade(mssv, courseId, score) {
  if (score !== null && score < 5.0) {
    eventBus.emitGradeFail(mssv, courseId, score);
  }
}

module.exports = {
  checkAndEmitGrade
};
