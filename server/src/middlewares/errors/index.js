const logger = require('../../infrastructure/logger');
const AppError = require('../../shared/errors/AppError');

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';
  
  const traceId = err.traceId || req.traceId || 'UNKNOWN';

  // Log the error
  logger.error(`${err.statusCode} - ${err.message} - [${req.method} ${req.originalUrl}] - TraceID: ${traceId}`, {
    stack: err.stack,
    traceId
  });

  res.status(err.statusCode).json({
    status: err.status,
    traceId: traceId,
    message: err.isOperational ? err.message : 'Internal Server Error'
  });
};
