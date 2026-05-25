const reportService = require('../services/reportService');

const createReport = async (req, res, next) => {
  try {
    const { title, description, weather_condition, temperature, lat, lon } = req.body;
    const report = await reportService.createReport(req.user.userId, {
      title, description, weatherCondition: weather_condition, temperature: temperature ? parseFloat(temperature) : null,
      lat: lat ? parseFloat(lat) : null, lon: lon ? parseFloat(lon) : null,
      mediaInfo: req.mediaInfo || null,
    });
    res.status(201).json({ success: true, data: { report } });
  } catch (err) {
    next(err);
  }
};

const getReports = async (req, res, next) => {
  try {
    const { page, limit, locationId, userId } = req.query;
    const result = await reportService.getReports({
      page: parseInt(page) || 1, limit: parseInt(limit) || 20,
      locationId: locationId ? parseInt(locationId) : undefined,
      userId: userId ? parseInt(userId) : undefined,
    });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getReportById = async (req, res, next) => {
  try {
    const report = await reportService.getReportById(req.params.id);
    let userVote = null;
    if (req.user) {
      userVote = await reportService.getUserVoteOnReport(req.params.id, req.user.userId);
    }
    res.json({ success: true, data: { report, userVote } });
  } catch (err) {
    next(err);
  }
};

const updateReport = async (req, res, next) => {
  try {
    const report = await reportService.updateReport(req.params.id, req.user.userId, req.body);
    res.json({ success: true, data: { report } });
  } catch (err) {
    next(err);
  }
};

const deleteReport = async (req, res, next) => {
  try {
    const result = await reportService.deleteReport(req.params.id, req.user.userId, req.user.role);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const voteOnReport = async (req, res, next) => {
  try {
    const { vote_type } = req.body;
    const result = await reportService.voteOnReport(req.params.id, req.user.userId, vote_type);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { createReport, getReports, getReportById, updateReport, deleteReport, voteOnReport };