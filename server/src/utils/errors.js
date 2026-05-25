class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

class NotFoundError extends AppError {
  constructor(message = 'Resource tidak ditemukan') {
    super(message, 404, 'NOT_FOUND');
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409, 'CONFLICT');
  }
}

class ExternalServiceError extends AppError {
  constructor(message) {
    super(message, 503, 'EXTERNAL_SERVICE_ERROR');
  }
}

class UnauthorizedError extends AppError {
  constructor(message = 'Tidak memiliki akses') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

class ForbiddenError extends AppError {
  constructor(message = 'Akses ditolak') {
    super(message, 403, 'FORBIDDEN');
  }
}

module.exports = {
  AppError,
  ValidationError,
  NotFoundError,
  ConflictError,
  ExternalServiceError,
  UnauthorizedError,
  ForbiddenError,
};
