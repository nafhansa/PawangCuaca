const express = require('express');
const router = express.Router();
const voteController = require('../controllers/voteController');
const { validateVoteBody } = require('../middleware/validateRequest');
const { voteLimiter } = require('../middleware/rateLimiter');

router.post('/', voteLimiter, validateVoteBody, voteController.submitVote);

module.exports = router;
