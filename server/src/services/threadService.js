const { pool } = require('../db/pool');
const { NotFoundError, ForbiddenError } = require('../utils/errors');
const { getOrCreateLocation } = require('./voteService');
const { updatePawangLevel } = require('./pawangService');

const createThread = async (userId, { title, lat, lon }) => {
  let locationId = null;
  if (lat && lon) {
    const location = await getOrCreateLocation(lat, lon);
    locationId = location.id;
  }
  const result = await pool.query(
    `INSERT INTO threads (user_id, location_id, title) VALUES ($1, $2, $3) RETURNING *`,
    [userId, locationId, title]
  );
  return result.rows[0];
};

const getThreads = async ({ page = 1, limit = 20 } = {}) => {
  const offset = (page - 1) * limit;
  const countResult = await pool.query("SELECT COUNT(*) FROM threads WHERE status = 'active'");
  const total = parseInt(countResult.rows[0].count);
  const result = await pool.query(
    `SELECT t.*, u.username, u.pawang_level, u.avatar_url, l.label as location_label, l.lat, l.lon,
     (SELECT COUNT(*) FROM thread_posts WHERE thread_id = t.id) as post_count,
     (SELECT tp.media_url FROM thread_posts tp WHERE tp.thread_id = t.id AND tp.media_url IS NOT NULL ORDER BY tp.position ASC LIMIT 1) as cover_media
     FROM threads t
     JOIN users u ON t.user_id = u.id
     LEFT JOIN locations l ON t.location_id = l.id
     WHERE t.status = 'active'
     ORDER BY t.updated_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );
  return { threads: result.rows, total, page, totalPages: Math.ceil(total / limit) };
};

const getThreadById = async (id) => {
  const threadResult = await pool.query(
    `SELECT t.*, u.username, u.pawang_level, u.avatar_url, l.label as location_label, l.lat, l.lon
     FROM threads t
     JOIN users u ON t.user_id = u.id
     LEFT JOIN locations l ON t.location_id = l.id
     WHERE t.id = $1`,
    [id]
  );
  if (threadResult.rows.length === 0) {
    throw new NotFoundError('Thread tidak ditemukan.');
  }
  const postsResult = await pool.query(
    `SELECT tp.*, u.username, u.pawang_level, u.avatar_url
     FROM thread_posts tp
     JOIN users u ON tp.user_id = u.id
     WHERE tp.thread_id = $1
     ORDER BY tp.position ASC, tp.created_at ASC`,
    [id]
  );
  const thread = threadResult.rows[0];
  thread.posts = postsResult.rows;
  return thread;
};

const addThreadPost = async (threadId, userId, { content, weatherCondition, temperature, mediaInfo }) => {
  const thread = await getThreadById(threadId);
  const maxPosResult = await pool.query(
    'SELECT COALESCE(MAX(position), -1) + 1 as next_pos FROM thread_posts WHERE thread_id = $1',
    [threadId]
  );
  const position = maxPosResult.rows[0].next_pos;
  const result = await pool.query(
    `INSERT INTO thread_posts (thread_id, user_id, content, media_url, media_type, media_size, weather_condition, temperature, position)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
    [threadId, userId, content, mediaInfo?.url || null, mediaInfo?.type || null, mediaInfo?.size || null, weatherCondition, temperature, position]
  );
  await pool.query('UPDATE threads SET updated_at = NOW() WHERE id = $1', [threadId]);
  await pool.query('UPDATE users SET report_count = report_count + 1, updated_at = NOW() WHERE id = $1', [userId]);
  await updatePawangLevel(userId);
  return result.rows[0];
};

const deleteThread = async (id, userId, userRole) => {
  const thread = await getThreadById(id);
  if (thread.user_id !== userId && userRole !== 'superadmin') {
    throw new ForbiddenError('Anda tidak dapat menghapus thread ini.');
  }
  await pool.query('UPDATE threads SET status = $1 WHERE id = $2', ['archived', id]);
  return { deleted: true };
};

module.exports = { createThread, getThreads, getThreadById, addThreadPost, deleteThread };