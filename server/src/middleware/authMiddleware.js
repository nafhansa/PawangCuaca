const jwt = require('jsonwebtoken');
const { UnauthorizedError } = require('../utils/errors');

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token tidak ditemukan. Silakan login.'));
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return next(new UnauthorizedError('Token sudah kadaluarsa. Silakan login kembali.'));
    }
    return next(new UnauthorizedError('Token tidak valid.'));
  }
};

module.exports = authMiddleware;