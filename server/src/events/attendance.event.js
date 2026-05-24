const eventBus = require('./eventBus');
const appLogger = require('../infrastructure/logger');

// ============================================================
// Attendance Event Handlers
// ============================================================

// Register listeners for attendance events
eventBus.on('ATTENDANCE_WARNING_EVENT', (payload) => {
  appLogger.warn(`[ATTENDANCE_MONITOR] Warning triggered for ${payload.mssv} — CC: ${payload.attendance}`);
  // Future: trigger notification, email, etc.
});

eventBus.on('ATTENDANCE_CRITICAL_EVENT', (payload) => {
  appLogger.error(`[ATTENDANCE_MONITOR] CRITICAL attendance for ${payload.mssv} — ${payload.message}`);
  // Future: escalate to advisor dashboard, send push notification
});

/**
 * Check attendance and emit appropriate events
 * @param {string} mssv
 * @param {number} attendancePct - Percentage (0-100)
 */
function checkAndEmitAttendance(mssv, attendancePct) {
  if (attendancePct < 50) {
    eventBus.emitAttendanceCritical(mssv, attendancePct);
  } else if (attendancePct < 60) {
    eventBus.emitAttendanceWarning(mssv, attendancePct);
  }
}

module.exports = {
  checkAndEmitAttendance
};
