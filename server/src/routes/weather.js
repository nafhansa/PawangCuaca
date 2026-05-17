const express = require('express');
const router = express.Router();
const weatherController = require('../controllers/weatherController');
const { validateWeatherQuery, validateVotesQuery } = require('../middleware/validateRequest');
const { weatherLimiter } = require('../middleware/rateLimiter');

router.get('/', weatherLimiter, validateWeatherQuery, weatherController.getWeather);
router.get('/votes', weatherLimiter, validateVotesQuery, weatherController.getWeatherVotes);

module.exports = router;
