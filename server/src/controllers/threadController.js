const threadService = require('../services/threadService');

const createThread = async (req, res, next) => {
  try {
    const { title, lat, lon } = req.body;
    const thread = await threadService.createThread(req.user.userId, {
      title, lat: lat ? parseFloat(lat) : null, lon: lon ? parseFloat(lon) : null,
    });
    res.status(201).json({ success: true, data: { thread } });
  } catch (err) {
    next(err);
  }
};

const getThreads = async (req, res, next) => {
  try {
    const { page, limit } = req.query;
    const result = await threadService.getThreads({ page: parseInt(page) || 1, limit: parseInt(limit) || 20 });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

const getThreadById = async (req, res, next) => {
  try {
    const thread = await threadService.getThreadById(req.params.id);
    res.json({ success: true, data: { thread } });
  } catch (err) {
    next(err);
  }
};

const addThreadPost = async (req, res, next) => {
  try {
    const { content, weather_condition, temperature } = req.body;
    const post = await threadService.addThreadPost(req.params.id, req.user.userId, {
      content, weatherCondition: weather_condition, temperature: temperature ? parseFloat(temperature) : null,
      mediaInfo: req.mediaInfo || null,
    });
    res.status(201).json({ success: true, data: { post } });
  } catch (err) {
    next(err);
  }
};

const deleteThread = async (req, res, next) => {
  try {
    const result = await threadService.deleteThread(req.params.id, req.user.userId, req.user.role);
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
};

module.exports = { createThread, getThreads, getThreadById, addThreadPost, deleteThread };