const eventBus = require('./eventBus');
const appLogger = require('../infrastructure/logger');

// ============================================================
// Risk Event Handlers
// ============================================================

eventBus.on('RISK_ESCALATED_EVENT', (payload) => {
  appLogger.warn(`[RISK_MONITOR] Escalated: ${payload.mssv} → ${payload.level} (Score: ${payload.riskScore})`);
  // Future: update advisor dashboard in real-time via WebSocket
});

eventBus.on('RISK_DEESCALATED_EVENT', (payload) => {
  appLogger.info(`[RISK_MONITOR] De-escalated: ${payload.mssv} | ${payload.previousLevel} → ${payload.newLevel}`);
});

/**
 * Compare risk scores and emit escalation/deescalation events
 * @param {string} mssv
 * @param {number} newScore
 * @param {string} newLevel
 * @param {number|null} previousScore
 * @param {string|null} previousLevel
 */
function checkAndEmitRisk(mssv, newScore, newLevel, previousScore = null, previousLevel = null) {
  if (newScore >= 76) {
    eventBus.emitRiskEscalated(mssv, newScore, newLevel);
  }
  if (previousLevel && newLevel !== previousLevel) {
    const levelOrder = { LOW: 0, MEDIUM: 1, HIGH: 2, CRITICAL: 3 };
    if (levelOrder[newLevel] < levelOrder[previousLevel]) {
      eventBus.emitRiskDeescalated(mssv, newScore, previousLevel, newLevel);
    }
  }
}

module.exports = {
  checkAndEmitRisk
};
