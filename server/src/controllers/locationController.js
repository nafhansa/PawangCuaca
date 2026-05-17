const voteService = require('../services/voteService');
const logger = require('../utils/logger');

async function getLeaderboard(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 10;
    const leaderboard = await voteService.getLocationLeaderboard(limit);

    return res.json({
      success: true,
      data: leaderboard,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getLeaderboard };
