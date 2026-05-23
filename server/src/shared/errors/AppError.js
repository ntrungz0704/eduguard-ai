class AppError extends Error {
  constructor(message, statusCode, traceId = null) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.traceId = traceId;

    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
