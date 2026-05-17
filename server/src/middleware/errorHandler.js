const logger = require('../utils/logger');

const errorHandler = (err, req, res, _next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_SERVER_ERROR';
  const message = err.isOperational
    ? err.message
    : 'Terjadi kesalahan internal. Silakan coba lagi.';

  if (err.isOperational) {
    logger.warn(`Operational error: ${code} - ${message}`, {
      path: req.path,
      method: req.method,
    });
  } else {
    logger.error(`Unhandled error: ${code}`, {
      stack: err.stack,
      path: req.path,
      method: req.method,
    });
  }

  return res.status(statusCode).json({
    success: false,
    error: { code, message },
  });
};

module.exports = errorHandler;
