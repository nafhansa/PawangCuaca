const { ForbiddenError } = require('../utils/errors');

const roleMiddleware = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new ForbiddenError('Autentikasi diperlukan.'));
    }
    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Akses ditolak. Anda tidak memiliki izin.'));
    }
    next();
  };
};

module.exports = roleMiddleware;