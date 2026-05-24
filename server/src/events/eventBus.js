const EventEmitter = require('events');
const appLogger = require('../infrastructure/logger');

// ============================================================
// EduGuard AI — Central Event Bus
// All domain events flow through this singleton
// ============================================================

class EduGuardEventBus extends EventEmitter {
  constructor() {
    super();
    this.setMaxListeners(50); // Allow multiple listeners
    this._setupDefaultHandlers();
  }

  _setupDefaultHandlers() {
    // Log all events automatically
    this.on('*', (eventName, payload) => {
      appLogger.event(eventName, payload);
    });
  }

  /**
   * Emit an event and log it
   * @param {string} eventName
   * @param {object} payload
   */
  emitEvent(eventName, payload = {}) {
    appLogger.event(eventName, payload);
    this.emit(eventName, payload);
    this.emit('__all__', eventName, payload); // wildcard channel
  }

  // ─── Attendance Events ───────────────────────────────────
  emitAttendanceWarning(mssv, attendancePct) {
    this.emitEvent('ATTENDANCE_WARNING_EVENT', {
      mssv,
      attendance: `${Math.round(attendancePct)}%`,
      severity: attendancePct < 50 ? 'CRITICAL' : 'WARNING'
    });
  }

  emitAttendanceCritical(mssv, attendancePct) {
    this.emitEvent('ATTENDANCE_CRITICAL_EVENT', {
      mssv,
      attendance: `${Math.round(attendancePct)}%`,
      message: 'Nguy cơ cấm thi — cần can thiệp khẩn cấp'
    });
  }

  // ─── Grade Events ────────────────────────────────────────
  emitGradeFail(mssv, courseId, score) {
    this.emitEvent('GRADE_FAIL_EVENT', {
      mssv,
      courseId,
      score: score?.toFixed(1),
      message: `Rớt môn ${courseId}`
    });
  }

  emitGradeRecovery(mssv, courseId, newScore) {
    this.emitEvent('GRADE_RECOVERY_EVENT', {
      mssv,
      courseId,
      newScore: newScore?.toFixed(1),
      message: `Cải thiện điểm môn ${courseId}`
    });
  }

  // ─── Risk Events ─────────────────────────────────────────
  emitRiskEscalated(mssv, riskScore, level) {
    this.emitEvent('RISK_ESCALATED_EVENT', {
      mssv,
      riskScore,
      level,
      message: `Risk escalated to ${level}`
    });
  }

  emitRiskDeescalated(mssv, riskScore, previousLevel, newLevel) {
    this.emitEvent('RISK_DEESCALATED_EVENT', {
      mssv,
      riskScore,
      previousLevel,
      newLevel,
      message: `Risk improved: ${previousLevel} → ${newLevel}`
    });
  }

  // ─── Prerequisite/Intervention Events ───────────────────
  emitPrerequisiteBreak(mssv, failedCourses) {
    const courseList = failedCourses.map(c => c.courseId).join(', ');
    this.emitEvent('PREREQUISITE_BREAK_EVENT', {
      mssv,
      failedCourses: courseList,
      count: failedCourses.length,
      message: `Knowledge chain break detected: ${courseList}`
    });
  }

  emitInterventionNeeded(mssv, riskLevel) {
    this.emitEvent('INTERVENTION_NEEDED_EVENT', {
      mssv,
      riskLevel,
      message: `Intervention required for ${mssv} at level ${riskLevel}`
    });
  }

  emitInterventionCreated(mssv, courseId, advisorId) {
    this.emitEvent('INTERVENTION_CREATED_EVENT', {
      mssv,
      courseId,
      advisorId,
      message: `New intervention created for ${mssv}`
    });
  }
}

// Singleton
const eventBus = new EduGuardEventBus();

module.exports = eventBus;
