const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { validate } = require('../middleware/validateRequest');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const reportController = require('../controllers/reportController');

const createReportSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  description: Joi.string().max(2000).optional(),
  weather_condition: Joi.string().max(100).optional(),
  temperature: Joi.number().min(-100).max(60).optional(),
  lat: Joi.number().min(-90).max(90).optional(),
  lon: Joi.number().min(-180).max(180).optional(),
});

const updateReportSchema = Joi.object({
  title: Joi.string().min(3).max(255).optional(),
  description: Joi.string().max(2000).optional(),
  weather_condition: Joi.string().max(100).optional(),
  temperature: Joi.number().min(-100).max(60).optional(),
});

const voteSchema = Joi.object({
  vote_type: Joi.string().valid('upvote', 'downvote').required(),
});

router.post(
  '/',
  authMiddleware,
  roleMiddleware('produsen'),
  uploadMiddleware,
  validate(createReportSchema),
  reportController.createReport
);

router.get(
  '/',
  authMiddleware,
  reportController.getReports
);

router.get(
  '/:id',
  authMiddleware,
  reportController.getReportById
);

router.put(
  '/:id',
  authMiddleware,
  roleMiddleware('produsen'),
  validate(updateReportSchema),
  reportController.updateReport
);

router.delete(
  '/:id',
  authMiddleware,
  reportController.deleteReport
);

router.post(
  '/:id/vote',
  authMiddleware,
  roleMiddleware('konsumen'),
  validate(voteSchema),
  reportController.voteOnReport
);

module.exports = router;
