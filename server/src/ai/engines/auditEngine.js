const fs = require('fs');
const path = require('path');

/**
 * Audit Engine (System Logging)
 * Lưu vết mọi quyết định hỗ trợ của hệ thống.
 */
function logAction({ user, action, target, context, timestamp = new Date().toISOString() }) {
  const logEntry = {
    user,
    action,
    target,
    context,
    timestamp
  };
  
  console.log(`[AUDIT_LOG] [${timestamp}] User: ${user} | Action: ${action} | Target: ${target}`);
  
  // In a real enterprise system, this writes to an ELK stack or a database audit table.
  // Here we simulate by appending to a local file for demo purposes.
  try {
    const logDir = path.join(__dirname, '..', '..', '..', 'logs');
    if (!fs.existsSync(logDir)) fs.mkdirSync(logDir, { recursive: true });
    
    const logPath = path.join(logDir, 'audit.log');
    fs.appendFileSync(logPath, JSON.stringify(logEntry) + '\n');
  } catch (e) {
    console.error(`[AUDIT_ERROR] Failed to write log: ${e.message}`);
  }
}

module.exports = {
  logAction
};
