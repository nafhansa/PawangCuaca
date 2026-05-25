const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { validate } = require('../middleware/validateRequest');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const uploadMiddleware = require('../middleware/uploadMiddleware');
const threadController = require('../controllers/threadController');

const createThreadSchema = Joi.object({
  title: Joi.string().min(3).max(255).required(),
  lat: Joi.number().min(-90).max(90).optional(),
  lon: Joi.number().min(-180).max(180).optional(),
});

const addPostSchema = Joi.object({
  content: Joi.string().min(1).max(2000).required(),
  weather_condition: Joi.string().max(100).optional(),
  temperature: Joi.number().min(-100).max(60).optional(),
});

router.post(
  '/',
  authMiddleware,
  roleMiddleware('produsen'),
  validate(createThreadSchema),
  threadController.createThread
);

router.get(
  '/',
  authMiddleware,
  threadController.getThreads
);

router.get(
  '/:id',
  authMiddleware,
  threadController.getThreadById
);

router.post(
  '/:id/posts',
  authMiddleware,
  roleMiddleware('produsen'),
  uploadMiddleware,
  validate(addPostSchema),
  threadController.addThreadPost
);

router.delete(
  '/:id',
  authMiddleware,
  threadController.deleteThread
);

module.exports = router;
