const { pool } = require('../db/pool');
const geoHash = require('../utils/geoHash');
const { ConflictError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');
const axios = require('axios');

async function reverseGeocode(lat, lon) {
  try {
    const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
      params: {
        lat,
        lon,
        format: 'json',
        zoom: 12,
        addressdetails: 1,
      },
      headers: {
        'User-Agent': 'PawangCuaca/1.0',
      },
      timeout: 5000,
    });

    const addr = response.data.address;
    if (!addr) return null;

    return [
      addr.suburb || addr.neighbourhood || addr.quarter,
      addr.city || addr.town || addr.village || addr.municipality,
      addr.state,
    ].filter(Boolean).join(', ') || null;
  } catch (err) {
    logger.error('Reverse geocode error', { error: err.message });
    return null;
  }
}

async function getOrCreateLocation(lat, lon) {
  const gh = geoHash.encode(parseFloat(lat), parseFloat(lon), 5);

  const existing = await pool.query(
    'SELECT id, geohash, lat, lon, label FROM locations WHERE geohash = $1',
    [gh]
  );

  if (existing.rows.length > 0) {
    return existing.rows[0];
  }

  const label = await reverseGeocode(lat, lon);

  const inserted = await pool.query(
    'INSERT INTO locations (geohash, lat, lon, label) VALUES ($1, $2, $3, $4) RETURNING id, geohash, lat, lon, label',
    [gh, parseFloat(lat), parseFloat(lon), label]
  );

  return inserted.rows[0];
}

async function submitVote(locationId, forecastHour, voteType, voterHash, ipHash, userId = null) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const existing = await client.query(
      'SELECT id FROM votes WHERE location_id = $1 AND forecast_hour = $2 AND voter_hash = $3',
      [locationId, forecastHour, voterHash]
    );

    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      throw new ConflictError('Kamu sudah memberikan vote untuk jam ini di lokasi ini.');
    }

    const voteResult = await client.query(
      'INSERT INTO votes (location_id, forecast_hour, vote_type, voter_hash, ip_hash, user_id) VALUES ($1, $2, $3, $4, $5, $6) RETURNING id',
      [locationId, forecastHour, voteType, voterHash, ipHash, userId]
    );

    const upsertResult = await client.query(
      `INSERT INTO vote_aggregates (location_id, forecast_hour, upvotes, downvotes, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (location_id, forecast_hour)
       DO UPDATE SET
         upvotes = vote_aggregates.upvotes + $3,
         downvotes = vote_aggregates.downvotes + $4,
         updated_at = NOW()
       RETURNING upvotes, downvotes, accuracy_pct`,
      [
        locationId,
        forecastHour,
        voteType === 'upvote' ? 1 : 0,
        voteType === 'downvote' ? 1 : 0,
      ]
    );

    await client.query('COMMIT');

    return {
      vote_id: voteResult.rows[0].id,
      forecast_hour: forecastHour,
      vote_type: voteType,
      updated_aggregate: {
        upvotes: upsertResult.rows[0].upvotes,
        downvotes: upsertResult.rows[0].downvotes,
        total: upsertResult.rows[0].upvotes + upsertResult.rows[0].downvotes,
        accuracy_pct: upsertResult.rows[0].accuracy_pct
          ? parseFloat(upsertResult.rows[0].accuracy_pct)
          : null,
      },
    };
  } catch (err) {
    await client.query('ROLLBACK');
    if (err instanceof ConflictError) {
      throw err;
    }
    logger.error('Vote submission error', { error: err.message });
    throw err;
  } finally {
    client.release();
  }
}

async function getVotesByHour(locationId, hours = 12, voterHash = null) {
  const now = new Date();
  const futureLimit = new Date(now.getTime() + hours * 60 * 60 * 1000);

  const aggregates = await pool.query(
    `SELECT forecast_hour, upvotes, downvotes, accuracy_pct
     FROM vote_aggregates
     WHERE location_id = $1
       AND forecast_hour >= $2
       AND forecast_hour <= $3
     ORDER BY forecast_hour ASC`,
    [locationId, now, futureLimit]
  );

  const userVotes = {};
  if (voterHash && aggregates.rows.length > 0) {
    const hours_list = aggregates.rows.map((r) => r.forecast_hour);
    const votesResult = await pool.query(
      'SELECT forecast_hour, vote_type FROM votes WHERE location_id = $1 AND forecast_hour = ANY($2) AND voter_hash = $3',
      [locationId, hours_list, voterHash]
    );

    votesResult.rows.forEach((v) => {
      userVotes[v.forecast_hour.toISOString()] = v.vote_type;
    });
  }

  return aggregates.rows.map((row) => {
    const date = new Date(row.forecast_hour);
    const hourLabel = `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    const key = row.forecast_hour.toISOString();

    return {
      forecast_hour: row.forecast_hour.toISOString(),
      hour_label: hourLabel,
      upvotes: row.upvotes,
      downvotes: row.downvotes,
      total: row.upvotes + row.downvotes,
      accuracy_pct: row.accuracy_pct ? parseFloat(row.accuracy_pct) : null,
      user_voted: userVotes[key] || null,
    };
  });
}

async function getLocationLeaderboard(limit = 10) {
  const result = await pool.query(
    `SELECT l.geohash, l.label, l.lat, l.lon,
            COALESCE(SUM(va.upvotes + va.downvotes), 0) as total_votes,
            COALESCE(AVG(va.accuracy_pct), 0) as avg_accuracy_pct
     FROM locations l
     LEFT JOIN vote_aggregates va ON l.id = va.location_id
     GROUP BY l.id, l.geohash, l.label, l.lat, l.lon
     ORDER BY total_votes DESC
     LIMIT $1`,
    [limit]
  );

  return result.rows.map((row) => ({
    geohash: row.geohash,
    label: row.label,
    lat: parseFloat(row.lat),
    lon: parseFloat(row.lon),
    total_votes: parseInt(row.total_votes, 10),
    avg_accuracy_pct: row.avg_accuracy_pct ? parseFloat(row.avg_accuracy_pct) : 0,
  }));
}

async function getRecentVotes(limit = 20, offset = 0) {
  const result = await pool.query(
    `SELECT v.id, v.vote_type, v.forecast_hour, v.created_at,
            l.geohash, l.label, l.lat, l.lon,
            u.username as user_username
     FROM votes v
     JOIN locations l ON v.location_id = l.id
     LEFT JOIN users u ON v.user_id = u.id
     ORDER BY v.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  return result.rows.map((row) => ({
    id: row.id,
    vote_type: row.vote_type,
    forecast_hour: row.forecast_hour.toISOString(),
    created_at: row.created_at.toISOString(),
    geohash: row.geohash,
    label: row.label || row.geohash,
    lat: parseFloat(row.lat),
    lon: parseFloat(row.lon),
    user_username: row.user_username,
  }));
}

async function getUserVotes(userId, limit = 50) {
  const result = await pool.query(
    `SELECT v.id, v.vote_type, v.forecast_hour, v.created_at,
            l.geohash, l.label, l.lat, l.lon
     FROM votes v
     JOIN locations l ON v.location_id = l.id
     WHERE v.user_id = $1
     ORDER BY v.created_at DESC
     LIMIT $2`,
    [userId, limit]
  );

  return result.rows.map((row) => ({
    id: row.id,
    vote_type: row.vote_type,
    forecast_hour: row.forecast_hour.toISOString(),
    created_at: row.created_at.toISOString(),
    geohash: row.geohash,
    label: row.label || row.geohash,
    lat: parseFloat(row.lat),
    lon: parseFloat(row.lon),
  }));
}

module.exports = {
  getOrCreateLocation,
  submitVote,
  getVotesByHour,
  getLocationLeaderboard,
  getRecentVotes,
  getUserVotes,
};
