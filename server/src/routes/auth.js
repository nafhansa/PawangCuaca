const express = require('express');
const router = express.Router();
const Joi = require('joi');
const { validate } = require('../middleware/validateRequest');
const { ValidationError } = require('../utils/errors');
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(6).max(100).required(),
  role: Joi.string().valid('produsen', 'konsumen').required(),
});

const loginSchema = Joi.object({
  identifier: Joi.string().min(3).max(255).required(),
  password: Joi.string().required(),
});

const updateProfileSchema = Joi.object({
  bio: Joi.string().max(500).optional(),
  avatar_url: Joi.string().uri().max(500).optional(),
});

router.post('/register', validate(registerSchema), authController.register);
router.post('/login', validate(loginSchema), authController.login);
router.get('/me', authMiddleware, authController.getMe);
router.put('/me', authMiddleware, validate(updateProfileSchema), authController.updateProfile);

module.exports = router;
