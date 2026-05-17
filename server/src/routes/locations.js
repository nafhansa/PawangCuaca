const express = require('express');
const router = express.Router();
const locationController = require('../controllers/locationController');

router.get('/leaderboard', locationController.getLeaderboard);

module.exports = router;
