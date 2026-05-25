const { pool } = require('../db/pool');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const logger = require('../utils/logger');

const getUsers = async (req, res, next) => {
  try {
    const { status, role, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;
    let whereClause = '';
    const params = [];
    let paramIdx = 1;
    if (status) {
      whereClause += `WHERE status = $${paramIdx++}`;
      params.push(status);
    }
    if (role) {
      whereClause += paramIdx > 1 ? ' AND' : 'WHERE';
      whereClause += ` role = $${paramIdx++}`;
      params.push(role);
    }
    const countResult = await pool.query(`SELECT COUNT(*) FROM users ${whereClause}`, params);
    const total = parseInt(countResult.rows[0].count);
    const result = await pool.query(
      `SELECT id, username, email, role, status, pawang_level, report_count, accuracy_score, created_at FROM users ${whereClause} ORDER BY created_at DESC LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
      [...params, limit, offset]
    );
    res.json({ success: true, data: { users: result.rows, total, page, totalPages: Math.ceil(total / limit) } });
  } catch (err) {
    next(err);
  }
};

const approveUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE users SET status = 'approved', updated_at = NOW() WHERE id = $1 RETURNING id, username, email, role, status",
      [id]
    );
    if (result.rows.length === 0) throw new NotFoundError('User tidak ditemukan.');
    logger.info(`User ${id} approved by ${req.user.userId}`);
    res.json({ success: true, data: { user: result.rows[0] } });
  } catch (err) {
    next(err);
  }
};

const rejectUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "UPDATE users SET status = 'rejected', updated_at = NOW() WHERE id = $1 RETURNING id, username, email, role, status",
      [id]
    );
    if (result.rows.length === 0) throw new NotFoundError('User tidak ditemukan.');
    logger.info(`User ${id} rejected by ${req.user.userId}`);
    res.json({ success: true, data: { user: result.rows[0] } });
  } catch (err) {
    next(err);
  }
};

const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (parseInt(id) === req.user.userId) throw new ForbiddenError('Tidak dapat menghapus akun sendiri.');
    const result = await pool.query('DELETE FROM users WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) throw new NotFoundError('User tidak ditemukan.');
    logger.info(`User ${id} deleted by ${req.user.userId}`);
    res.json({ success: true, data: { deleted: true } });
  } catch (err) {
    next(err);
  }
};

const getStats = async (req, res, next) => {
  try {
    const usersByRole = await pool.query(
      'SELECT role, COUNT(*) as count FROM users GROUP BY role'
    );
    const usersByStatus = await pool.query(
      'SELECT status, COUNT(*) as count FROM users GROUP BY status'
    );
    const totalReports = await pool.query('SELECT COUNT(*) as count FROM reports WHERE status = $1', ['active']);
    const totalThreads = await pool.query('SELECT COUNT(*) as count FROM threads WHERE status = $1', ['active']);
    res.json({
      success: true,
      data: {
        usersByRole: Object.fromEntries(usersByRole.rows.map(r => [r.role, parseInt(r.count)])),
        usersByStatus: Object.fromEntries(usersByStatus.rows.map(r => [r.status, parseInt(r.count)])),
        totalReports: parseInt(totalReports.rows[0].count),
        totalThreads: parseInt(totalThreads.rows[0].count),
      },
    });
  } catch (err) {
    next(err);
  }
};

const getDetailedStats = async (req, res, next) => {
  try {
    const [usersByRole, usersByStatus, totalReports, totalThreads, totalVotes, totalLocations, recentActivity] = await Promise.all([
      pool.query('SELECT role, COUNT(*) as count FROM users GROUP BY role'),
      pool.query('SELECT status, COUNT(*) as count FROM users GROUP BY status'),
      pool.query("SELECT COUNT(*) as count FROM reports WHERE status = 'active'"),
      pool.query("SELECT COUNT(*) as count FROM threads WHERE status = 'active'"),
      pool.query('SELECT COUNT(*) as count FROM votes'),
      pool.query('SELECT COUNT(*) as count FROM locations'),
      pool.query(`
        SELECT DATE_TRUNC('day', created_at) as date, COUNT(*) as count
        FROM votes
        WHERE created_at >= NOW() - INTERVAL '30 days'
        GROUP BY DATE_TRUNC('day', created_at)
        ORDER BY date ASC
        LIMIT 30
      `),
    ]);

    const topLocations = await pool.query(
      `SELECT l.label, l.lat, l.lon, COUNT(v.id) as vote_count
       FROM locations l
       JOIN votes v ON l.id = v.location_id
       GROUP BY l.id, l.label, l.lat, l.lon
       ORDER BY vote_count DESC
       LIMIT 10`
    );

    res.json({
      success: true,
      data: {
        usersByRole: Object.fromEntries(usersByRole.rows.map(r => [r.role, parseInt(r.count)])),
        usersByStatus: Object.fromEntries(usersByStatus.rows.map(r => [r.status, parseInt(r.count)])),
        totalReports: parseInt(totalReports.rows[0].count),
        totalThreads: parseInt(totalThreads.rows[0].count),
        totalVotes: parseInt(totalVotes.rows[0].count),
        totalLocations: parseInt(totalLocations.rows[0].count),
        voteActivity: recentActivity.rows.map(r => ({
          date: r.date.toISOString().split('T')[0],
          count: parseInt(r.count),
        })),
        topLocations: topLocations.rows.map(r => ({
          label: r.label,
          lat: parseFloat(r.lat),
          lon: parseFloat(r.lon),
          vote_count: parseInt(r.vote_count),
        })),
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getUsers, approveUser, rejectUser, deleteUser, getStats, getDetailedStats };