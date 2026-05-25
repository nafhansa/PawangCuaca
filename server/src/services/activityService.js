const { pool } = require('../db/pool');
const logger = require('../utils/logger');

async function getUserActivity(userId, limit = 50) {
  try {
    // Get reports created by user
    const reportsResult = await pool.query(
      `SELECT 
        'report' as type,
        r.id,
        r.title,
        r.weather_condition,
        r.temperature,
        r.created_at,
        l.label as location_label,
        l.lat,
        l.lon,
        NULL as vote_type,
        NULL as thread_title,
        NULL as post_content,
        r.upvotes as upvotes,
        r.downvotes as downvotes
      FROM reports r
      LEFT JOIN locations l ON r.location_id = l.id
      WHERE r.user_id = $1 AND r.status = 'active'
      ORDER BY r.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    // Get report votes by user
    const reportVotesResult = await pool.query(
      `SELECT 
        'report_vote' as type,
        rv.id,
        r.title,
        r.weather_condition,
        NULL as temperature,
        rv.created_at,
        l.label as location_label,
        l.lat,
        l.lon,
        rv.vote_type,
        NULL as thread_title,
        NULL as post_content,
        NULL as upvotes,
        NULL as downvotes
      FROM report_votes rv
      JOIN reports r ON rv.report_id = r.id
      LEFT JOIN locations l ON r.location_id = l.id
      WHERE rv.user_id = $1
      ORDER BY rv.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    // Get threads created by user
    const threadsResult = await pool.query(
      `SELECT 
        'thread' as type,
        t.id,
        t.title,
        NULL as weather_condition,
        NULL as temperature,
        t.created_at,
        l.label as location_label,
        l.lat,
        l.lon,
        NULL as vote_type,
        t.title as thread_title,
        NULL as post_content,
        NULL as upvotes,
        NULL as downvotes
      FROM threads t
      LEFT JOIN locations l ON t.location_id = l.id
      WHERE t.user_id = $1 AND t.status = 'active'
      ORDER BY t.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    // Get thread posts by user
    const postsResult = await pool.query(
      `SELECT 
        'thread_post' as type,
        tp.id,
        NULL as title,
        tp.weather_condition,
        tp.temperature,
        tp.created_at,
        l.label as location_label,
        l.lat,
        l.lon,
        NULL as vote_type,
        t.title as thread_title,
        LEFT(tp.content, 100) as post_content,
        NULL as upvotes,
        NULL as downvotes
      FROM thread_posts tp
      JOIN threads t ON tp.thread_id = t.id
      LEFT JOIN locations l ON t.location_id = l.id
      WHERE tp.user_id = $1
      ORDER BY tp.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    // Get weather votes by user (cuaca votes)
    const weatherVotesResult = await pool.query(
      `SELECT 
        'weather_vote' as type,
        v.id,
        NULL as title,
        NULL as weather_condition,
        NULL as temperature,
        v.created_at,
        l.label as location_label,
        l.lat,
        l.lon,
        v.vote_type,
        NULL as thread_title,
        NULL as post_content,
        NULL as upvotes,
        NULL as downvotes
      FROM votes v
      JOIN locations l ON v.location_id = l.id
      WHERE v.user_id = $1
      ORDER BY v.created_at DESC
      LIMIT $2`,
      [userId, limit]
    );

    // Combine and sort by created_at descending
    const allActivities = [
      ...reportsResult.rows,
      ...reportVotesResult.rows,
      ...threadsResult.rows,
      ...postsResult.rows,
      ...weatherVotesResult.rows,
    ];

    allActivities.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

    return allActivities.slice(0, limit).map((row) => ({
      type: row.type,
      id: row.id,
      title: row.title,
      weather_condition: row.weather_condition,
      temperature: row.temperature ? parseFloat(row.temperature) : null,
      created_at: row.created_at.toISOString(),
      location_label: row.location_label,
      lat: row.lat ? parseFloat(row.lat) : null,
      lon: row.lon ? parseFloat(row.lon) : null,
      vote_type: row.vote_type,
      thread_title: row.thread_title,
      post_content: row.post_content,
      upvotes: row.upvotes ? parseInt(row.upvotes, 10) : null,
      downvotes: row.downvotes ? parseInt(row.downvotes, 10) : null,
    }));
  } catch (err) {
    logger.error('Get user activity error', { error: err.message, userId });
    throw err;
  }
}

module.exports = { getUserActivity };
