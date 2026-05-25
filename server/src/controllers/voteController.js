const voteService = require('../services/voteService');
const ipHasher = require('../utils/ipHasher');
const logger = require('../utils/logger');

async function submitVote(req, res, next) {
  try {
    const { lat, lon, forecast_hour, vote_type, voter_fingerprint } = req.body;

    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    const ipHash = ipHasher.hashIP(ip);
    const voterHash = ipHasher.generateVoterHash(ip, voter_fingerprint);

    const location = await voteService.getOrCreateLocation(lat, lon);

    const userId = req.user?.id || null;

    const result = await voteService.submitVote(
      location.id,
      forecast_hour,
      vote_type,
      voterHash,
      ipHash,
      userId
    );

    return res.status(201).json({
      success: true,
      data: result,
    });
  } catch (err) {
    return next(err);
  }
}

async function getRecentVotes(req, res, next) {
  try {
    const limit = parseInt(req.query.limit, 10) || 20;
    const offset = parseInt(req.query.offset, 10) || 0;
    const votes = await voteService.getRecentVotes(Math.min(limit, 50), offset);

    return res.json({
      success: true,
      data: votes,
    });
  } catch (err) {
    return next(err);
  }
}

async function getMyVotes(req, res, next) {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit, 10) || 50;
    const votes = await voteService.getUserVotes(userId, Math.min(limit, 100));

    return res.json({
      success: true,
      data: votes,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { submitVote, getRecentVotes, getMyVotes };
