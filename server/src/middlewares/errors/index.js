const logger = require('../../infrastructure/logger');
const AppError = require('../../shared/errors/AppError');

/**
 * Maps HTTP status codes to machine-readable error codes.
 * Enables frontend to handle errors programmatically without parsing messages.
 */
const STATUS_CODE_MAP = {
  400: 'BAD_REQUEST',
  401: 'UNAUTHORIZED',
  403: 'FORBIDDEN',
  404: 'NOT_FOUND',
  409: 'CONFLICT',
  422: 'UNPROCESSABLE_ENTITY',
  429: 'TOO_MANY_REQUESTS',
  500: 'INTERNAL_SERVER_ERROR',
  503: 'SERVICE_UNAVAILABLE',
};

/**
 * Global Error Handler Middleware
 * Catches all errors passed via next(err) and returns a standardized
 * Unified Error Response format:
 *
 * {
 *   "success": false,
 *   "error": { "code": "...", "message": "..." },
 *   "traceId": "...",
 *   "timestamp": "..."
 * }
 */
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  const traceId = err.traceId || req.traceId || 'UNKNOWN';

  // Always log the full error server-side
  logger.error(`[${err.statusCode}] ${err.message} — ${req.method} ${req.originalUrl} — TraceID: ${traceId}`, {
    stack: err.stack,
    traceId,
    isOperational: err.isOperational || false,
  });

  // For operational errors: safe to expose details to client
  // For programming errors: only return generic message (never expose internals)
  const isOperational = err.isOperational === true;
  const errorCode = err.code || STATUS_CODE_MAP[err.statusCode] || 'INTERNAL_SERVER_ERROR';
  const errorMessage = isOperational ? err.message : 'An unexpected internal error occurred.';

  return res.status(err.statusCode).json({
    success: false,
    error: {
      code: errorCode,
      message: errorMessage,
    },
    traceId,
    timestamp: new Date().toISOString(),
  });
};
