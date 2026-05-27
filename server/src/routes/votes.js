const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const { validateVoteBody } = require('../middleware/validateRequest');
const { voteLimiter, weatherLimiter } = require('../middleware/rateLimiter');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/recent', weatherLimiter, voteController.getRecentVotes);
router.get('/my', authMiddleware, weatherLimiter, voteController.getMyVotes);
router.post('/', voteLimiter, validateVoteBody, voteController.submitVote);

module.exports = router;
