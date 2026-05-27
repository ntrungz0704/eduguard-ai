/**
 * Audit Logging Middleware
 *
 * Records who accessed what student data and when.
 * Critical for compliance and detecting unauthorized data access patterns.
 *
 * In EduGuard context, this answers questions like:
 *   - "Which advisor viewed student PS47261's risk profile at 14:32?"
 *   - "How many times was a CRITICAL student's record accessed today?"
 *
 * Audit logs are written to a dedicated audit logger (separate from app logs)
 * so they can be shipped to a separate log store (e.g., S3, SIEM) in production.
 *
 * Usage:
 *   const { auditLog } = require('../../middlewares/audit');
 *
 *   router.get('/:mssv', jwtMiddleware, auditLog('VIEW_STUDENT_PROFILE'), controller.fn);
 */

const logger = require('../../infrastructure/logger');

/**
 * Formats the audit event as a structured JSON log entry.
 * All fields are explicit — no free-form messages.
 */
const createAuditEntry = ({ action, req, targetId = null, meta = {} }) => ({
  // Who
  actorId: req.user?.id || 'ANONYMOUS',
  actorRole: req.user?.role || 'UNKNOWN',

  // What
  action,
  targetId,

  // Where / How
  endpoint: `${req.method} ${req.originalUrl}`,
  traceId: req.traceId || 'UNKNOWN',
  ipAddress: req.ip || req.headers['x-forwarded-for'] || 'UNKNOWN',
  userAgent: req.headers['user-agent'] || 'UNKNOWN',

  // When
  timestamp: new Date().toISOString(),

  // Additional context
  ...meta,
});

/**
 * auditLog(action) — Middleware factory.
 * Logs a structured audit entry AFTER the response is sent.
 * Using 'res.on("finish")' ensures we log actual completed requests, not just attempts.
 *
 * @param {string} action - Descriptive action name (e.g. 'VIEW_STUDENT_PROFILE')
 * @param {Function} [getTargetId] - Optional function to extract target ID from req
 *                                   Defaults to req.params.mssv || req.params.id
 */
const auditLog = (action, getTargetId = null) => (req, res, next) => {
  res.on('finish', () => {
    // Only log successful requests (2xx and 3xx)
    if (res.statusCode >= 400) return;

    const targetId = getTargetId
      ? getTargetId(req)
      : (req.params.mssv || req.params.id || null);

    const entry = createAuditEntry({ action, req, targetId });

    logger.info('[AUDIT]', entry);
  });

  return next();
};

/**
 * Pre-defined audit actions for consistent naming across the codebase.
 * Using constants prevents typos and enables easy log searching.
 */
const AUDIT_ACTIONS = {
  // Student data access
  VIEW_STUDENT_LIST: 'VIEW_STUDENT_LIST',
  VIEW_STUDENT_PROFILE: 'VIEW_STUDENT_PROFILE',
  VIEW_STUDENT_RISK: 'VIEW_STUDENT_RISK',

  // AI / Analysis
  RUN_PREDICTION: 'RUN_PREDICTION',
  USE_NLP_ASSISTANT: 'USE_NLP_ASSISTANT',
  VIEW_CLASS_ANALYTICS: 'VIEW_CLASS_ANALYTICS',

  // Interventions
  CREATE_INTERVENTION: 'CREATE_INTERVENTION',
  UPDATE_INTERVENTION: 'UPDATE_INTERVENTION',

  // Auth events
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
};

module.exports = { auditLog, AUDIT_ACTIONS };
