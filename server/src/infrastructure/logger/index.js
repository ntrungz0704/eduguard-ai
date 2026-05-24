const winston = require('winston');

// ============================================================
// EduGuard AI — Professional Logger with Domain-Specific Methods
// ============================================================

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'eduguard-ai-backend' },
  transports: [
    new winston.transports.Console({
      format: process.env.NODE_ENV === 'production'
        ? winston.format.json()
        : winston.format.combine(
            winston.format.colorize(),
            winston.format.printf(({ timestamp, level, message, ...meta }) => {
              const metaStr = Object.keys(meta).length > 0 && meta.service !== 'eduguard-ai-backend'
                ? ` | ${JSON.stringify(meta)}`
                : '';
              return `[${timestamp}] ${level}: ${message}${metaStr}`;
            })
          )
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// ============================================================
// Domain-Specific Helper Methods
// ============================================================

/**
 * Log AI Router decisions
 * [AI_ROUTER] Intent: STUDENT_ANALYTICS_INTENT | Student: PS47261 | Confidence: high
 */
logger.aiRouter = function(intent, studentMssv = null, extra = {}) {
  const msg = `[AI_ROUTER] Intent: ${intent}${studentMssv ? ` | Student: ${studentMssv}` : ''}`;
  this.info(msg, { domain: 'AI_ROUTER', intent, studentMssv, ...extra });
};

/**
 * Log Session lifecycle events
 * [SESSION] Created | SID: abc123 | Role: TEACHER
 */
logger.session = function(action, sessionId, extra = {}) {
  const msg = `[SESSION] ${action}${sessionId ? ` | SID: ${sessionId}` : ''}`;
  this.info(msg, { domain: 'SESSION', action, sessionId, ...extra });
};

/**
 * Log Security enforcement decisions
 * [SECURITY] Blocked CLASS_ANALYTICS for STUDENT PS12345
 */
logger.security = function(action, userId, extra = {}) {
  const msg = `[SECURITY] ${action}${userId ? ` | User: ${userId}` : ''}`;
  this.warn(msg, { domain: 'SECURITY', action, userId, ...extra });
};

/**
 * Log Event System emissions
 * [EVENT] ATTENDANCE_WARNING_EVENT | mssv: PS47261 | attendance: 58%
 */
logger.event = function(eventName, payload = {}) {
  const payloadStr = Object.entries(payload)
    .map(([k, v]) => `${k}: ${v}`)
    .join(' | ');
  const msg = `[EVENT] ${eventName}${payloadStr ? ` | ${payloadStr}` : ''}`;
  this.info(msg, { domain: 'EVENT', eventName, ...payload });
};

/**
 * Log Cache operations
 * [CACHE] HIT | class:analytics
 * [CACHE] MISS | risk:ranking → computed and stored
 */
logger.cache = function(action, key, extra = '') {
  const msg = `[CACHE] ${action} | ${key}${extra ? ` → ${extra}` : ''}`;
  this.info(msg, { domain: 'CACHE', action, key });
};

/**
 * Log DSS Engine computations
 * [DSS] MSSV: PS47261 | Score: 82 | Level: CRITICAL | Factors: 3
 */
logger.dss = function(mssv, riskScore, level, factorCount = 0) {
  const msg = `[DSS] MSSV: ${mssv} | Score: ${riskScore} | Level: ${level} | Factors: ${factorCount}`;
  this.info(msg, { domain: 'DSS', mssv, riskScore, level, factorCount });
};

/**
 * Log Intent Trace for debugging NLP pipeline
 * [INTENT_TRACE] Input: "nguyên nhân" | NLP: None | Final: FOLLOWUP_ROOT_CAUSE_INTENT
 */
logger.intentTrace = function(input, nlpIntent, finalIntent, sessionId = null) {
  const msg = `[INTENT_TRACE] Input: "${input}" | NLP: ${nlpIntent} | Final: ${finalIntent}${sessionId ? ` | SID: ${sessionId}` : ''}`;
  this.info(msg, { domain: 'INTENT_TRACE', input, nlpIntent, finalIntent, sessionId });
};

/**
 * Log Request info
 * [REQUEST] POST /api/chatbot | 200 | 45ms | TraceId: abc
 */
logger.request = function(method, path, statusCode, durationMs, traceId = null) {
  const msg = `[REQUEST] ${method} ${path} | ${statusCode} | ${durationMs}ms${traceId ? ` | TraceId: ${traceId}` : ''}`;
  this.info(msg, { domain: 'REQUEST', method, path, statusCode, durationMs, traceId });
};

module.exports = logger;
