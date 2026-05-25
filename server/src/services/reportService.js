const { pool } = require('../db/pool');
const { NotFoundError, ConflictError, ForbiddenError } = require('../utils/errors');
const { getOrCreateLocation } = require('./voteService');
const { updatePawangLevel } = require('./pawangService');

const createReport = async (userId, { title, description, weatherCondition, temperature, lat, lon, mediaInfo }) => {
  let locationId = null;
  if (lat && lon) {
    const location = await getOrCreateLocation(lat, lon);
    locationId = location.id;
  }
  const result = await pool.query(
    `INSERT INTO reports (user_id, location_id, title, description, weather_condition, temperature, media_url, media_type, media_size)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [userId, locationId, title, description, weatherCondition, temperature, mediaInfo?.url || null, mediaInfo?.type || null, mediaInfo?.size || null]
  );
  await pool.query('UPDATE users SET report_count = report_count + 1, updated_at = NOW() WHERE id = $1', [userId]);
  await updatePawangLevel(userId);
  return result.rows[0];
};

const getReports = async ({ page = 1, limit = 20, locationId, userId } = {}) => {
  const offset = (page - 1) * limit;
  let whereClause = "WHERE r.status = 'active'";
  const params = [];
  let paramIdx = 1;
  if (locationId) {
    whereClause += ` AND r.location_id = $${paramIdx++}`;
    params.push(locationId);
  }
  if (userId) {
    whereClause += ` AND r.user_id = $${paramIdx++}`;
    params.push(userId);
  }
  const countResult = await pool.query(`SELECT COUNT(*) FROM reports r ${whereClause}`, params);
  const total = parseInt(countResult.rows[0].count);
  const result = await pool.query(
    `SELECT r.*, u.username, u.pawang_level, u.avatar_url, l.label as location_label, l.lat, l.lon
     FROM reports r
     JOIN users u ON r.user_id = u.id
     LEFT JOIN locations l ON r.location_id = l.id
     ${whereClause}
     ORDER BY r.created_at DESC
     LIMIT $${paramIdx++} OFFSET $${paramIdx++}`,
    [...params, limit, offset]
  );
  return { reports: result.rows, total, page, totalPages: Math.ceil(total / limit) };
};

const getReportById = async (id) => {
  const result = await pool.query(
    `SELECT r.*, u.username, u.pawang_level, u.avatar_url, u.report_count as author_report_count, u.accuracy_score as author_accuracy_score,
     l.label as location_label, l.lat, l.lon
     FROM reports r
     JOIN users u ON r.user_id = u.id
     LEFT JOIN locations l ON r.location_id = l.id
     WHERE r.id = $1`,
    [id]
  );
  if (result.rows.length === 0) {
    throw new NotFoundError('Laporan tidak ditemukan.');
  }
  return result.rows[0];
};

const updateReport = async (id, userId, updates) => {
  const report = await getReportById(id);
  if (report.user_id !== userId) {
    throw new ForbiddenError('Anda tidak dapat mengedit laporan orang lain.');
  }
  const fields = [];
  const values = [];
  let paramIdx = 1;
  const allowedFields = ['title', 'description', 'weather_condition', 'temperature'];
  for (const field of allowedFields) {
    if (updates[field] !== undefined) {
      fields.push(`${field} = $${paramIdx++}`);
      values.push(updates[field]);
    }
  }
  if (fields.length === 0) return report;
  fields.push(`updated_at = NOW()`);
  values.push(id);
  const result = await pool.query(
    `UPDATE reports SET ${fields.join(', ')} WHERE id = $${paramIdx} RETURNING *`,
    values
  );
  return result.rows[0];
};

const deleteReport = async (id, userId, userRole) => {
  const report = await getReportById(id);
  if (report.user_id !== userId && userRole !== 'superadmin') {
    throw new ForbiddenError('Anda tidak dapat menghapus laporan ini.');
  }
  await pool.query('UPDATE users SET report_count = GREATEST(report_count - 1, 0), updated_at = NOW() WHERE id = $1', [report.user_id]);
  await updatePawangLevel(report.user_id);
  await pool.query('DELETE FROM reports WHERE id = $1', [id]);
  return { deleted: true };
};

const voteOnReport = async (reportId, userId, voteType) => {
  const report = await getReportById(reportId);
  const existingVote = await pool.query(
    'SELECT id, vote_type FROM report_votes WHERE report_id = $1 AND user_id = $2',
    [reportId, userId]
  );
  if (existingVote.rows.length > 0) {
    if (existingVote.rows[0].vote_type === voteType) {
      throw new ConflictError('Anda sudah memberikan vote ini.');
    }
    await pool.query('UPDATE report_votes SET vote_type = $1 WHERE id = $2', [voteType, existingVote.rows[0].id]);
    const delta = voteType === 'upvote' ? 2 : -2;
    await pool.query(
      'UPDATE reports SET upvotes = upvotes + $1, downvotes = downvotes - $1, updated_at = NOW() WHERE id = $2',
      [voteType === 'upvote' ? 1 : -1, reportId]
    );
  } else {
    await pool.query(
      'INSERT INTO report_votes (report_id, user_id, vote_type) VALUES ($1, $2, $3)',
      [reportId, userId, voteType]
    );
    await pool.query(
      `UPDATE reports SET ${voteType === 'upvote' ? 'upvotes' : 'downvotes'} = ${voteType === 'upvote' ? 'upvotes' : 'downvotes'} + 1, updated_at = NOW() WHERE id = $1`,
      [reportId]
    );
  }
  const updated = await pool.query('SELECT upvotes, downvotes FROM reports WHERE id = $1', [reportId]);
  const total = updated.rows[0].upvotes + updated.rows[0].downvotes;
  const accuracyPct = total > 0 ? Math.round((updated.rows[0].upvotes / total) * 10000) / 100 : null;
  await pool.query('UPDATE reports SET accuracy_pct = $1 WHERE id = $2', [accuracyPct, reportId]);
  await updatePawangLevel(report.user_id);
  return {
    voteType,
    upvotes: updated.rows[0].upvotes,
    downvotes: updated.rows[0].downvotes,
    accuracyPct,
  };
};

const getUserVoteOnReport = async (reportId, userId) => {
  const result = await pool.query(
    'SELECT vote_type FROM report_votes WHERE report_id = $1 AND user_id = $2',
    [reportId, userId]
  );
  return result.rows.length > 0 ? result.rows[0].vote_type : null;
};

module.exports = { createReport, getReports, getReportById, updateReport, deleteReport, voteOnReport, getUserVoteOnReport };