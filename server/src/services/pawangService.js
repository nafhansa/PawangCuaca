const { pool } = require('../db/pool');

const LEVEL_THRESHOLDS = [
  { level: 'legenda', minReports: 100, minAccuracy: 85 },
  { level: 'elite', minReports: 30, minAccuracy: 75 },
  { level: 'andal', minReports: 10, minAccuracy: 60 },
  { level: 'pemula', minReports: 0, minAccuracy: 0 },
];

const calculatePawangLevel = (reportCount, accuracyScore) => {
  for (const threshold of LEVEL_THRESHOLDS) {
    if (reportCount >= threshold.minReports && accuracyScore >= threshold.minAccuracy) {
      return threshold.level;
    }
  }
  return 'pemula';
};

const updatePawangLevel = async (userId) => {
  const result = await pool.query(
    `SELECT u.report_count,
     COALESCE(
       (SELECT AVG(r.accuracy_pct) FROM reports r WHERE r.user_id = u.id AND r.accuracy_pct IS NOT NULL),
       0
     ) as avg_accuracy
     FROM users u WHERE u.id = $1`,
    [userId]
  );
  if (result.rows.length === 0) return;
  const { report_count, avg_accuracy } = result.rows[0];
  const newLevel = calculatePawangLevel(report_count, parseFloat(avg_accuracy) || 0);
  await pool.query(
    'UPDATE users SET pawang_level = $1, accuracy_score = $2, updated_at = NOW() WHERE id = $3',
    [newLevel, Math.round(parseFloat(avg_accuracy) * 100) / 100 || 0, userId]
  );
  return newLevel;
};

const getPawangInfo = async (userId) => {
  const result = await pool.query(
    `SELECT id, username, pawang_level, report_count, accuracy_score FROM users WHERE id = $1`,
    [userId]
  );
  if (result.rows.length === 0) return null;
  const user = result.rows[0];
  const nextLevel = LEVEL_THRESHOLDS.find(t => {
    const currentIdx = LEVEL_THRESHOLDS.findIndex(l => l.level === user.pawang_level);
    const nextIdx = currentIdx > 0 ? currentIdx - 1 : -1;
    return LEVEL_THRESHOLDS.indexOf(t) === nextIdx;
  });
  return {
    ...user,
    nextLevel: nextLevel ? {
      level: nextLevel.level,
      reportsNeeded: Math.max(0, nextLevel.minReports - user.report_count),
      accuracyNeeded: Math.max(0, nextLevel.minAccuracy - parseFloat(user.accuracy_score)),
    } : null,
  };
};

module.exports = { calculatePawangLevel, updatePawangLevel, getPawangInfo };