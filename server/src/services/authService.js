const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool } = require('../db/pool');
const { ConflictError, UnauthorizedError, NotFoundError, ValidationError, ForbiddenError } = require('../utils/errors');

const SALT_ROUNDS = 12;
const JWT_SECRET = process.env.JWT_SECRET || 'pawangcuaca_jwt_secret_change_in_production';
const JWT_EXPIRES_IN = '24h';

const register = async ({ username, email, password, role }) => {
  const existingUser = await pool.query(
    'SELECT id FROM users WHERE email = $1 OR username = $2',
    [email, username]
  );
  if (existingUser.rows.length > 0) {
    throw new ConflictError('Email atau username sudah terdaftar.');
  }
  if (!['produsen', 'konsumen'].includes(role)) {
    throw new ValidationError('Role harus produsen atau konsumen.');
  }
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  const result = await pool.query(
    `INSERT INTO users (username, email, password_hash, role, status)
     VALUES ($1, $2, $3, $4, 'pending') RETURNING id, username, email, role, status, pawang_level, created_at`,
    [username, email, passwordHash, role]
  );
  return result.rows[0];
};

const login = async ({ email, password }) => {
  const result = await pool.query(
    'SELECT id, username, email, password_hash, role, status, pawang_level, avatar_url FROM users WHERE email = $1',
    [email]
  );
  if (result.rows.length === 0) {
    throw new UnauthorizedError('Email atau password salah.');
  }
  const user = result.rows[0];
  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    throw new UnauthorizedError('Email atau password salah.');
  }
  if (user.status === 'pending') {
    throw new ForbiddenError('Akun belum disetujui oleh admin. Silakan tunggu.');
  }
  if (user.status === 'rejected') {
    throw new ForbiddenError('Akun ditolak oleh admin. Hubungi administrator.');
  }
  const token = jwt.sign(
    { userId: user.id, username: user.username, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
  const { password_hash, ...userWithoutPassword } = user;
  return { token, user: userWithoutPassword };
};

const getMe = async (userId) => {
  const result = await pool.query(
    `SELECT id, username, email, role, status, pawang_level, report_count, accuracy_score, avatar_url, bio, created_at, updated_at FROM users WHERE id = $1`,
    [userId]
  );
  if (result.rows.length === 0) {
    throw new NotFoundError('User tidak ditemukan.');
  }
  return result.rows[0];
};

const updateProfile = async (userId, { bio, avatar_url }) => {
  const result = await pool.query(
    `UPDATE users SET bio = COALESCE($2, bio), avatar_url = COALESCE($3, avatar_url), updated_at = NOW() WHERE id = $1 RETURNING id, username, email, role, status, pawang_level, report_count, accuracy_score, avatar_url, bio, created_at, updated_at`,
    [userId, bio, avatar_url]
  );
  if (result.rows.length === 0) {
    throw new NotFoundError('User tidak ditemukan.');
  }
  return result.rows[0];
};

module.exports = { register, login, getMe, updateProfile };