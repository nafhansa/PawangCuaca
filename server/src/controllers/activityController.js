const activityService = require('../services/activityService');

async function getMyActivity(req, res, next) {
  try {
    const userId = req.user.userId;
    const limit = parseInt(req.query.limit, 10) || 50;
    const activities = await activityService.getUserActivity(userId, Math.min(limit, 100));

    return res.json({
      success: true,
      data: activities,
    });
  } catch (err) {
    return next(err);
  }
}

module.exports = { getMyActivity };
