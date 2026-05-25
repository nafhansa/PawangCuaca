const express = require('express');
const router = express.Router();
const activityController = require('../controllers/activityController');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/my', authMiddleware, activityController.getMyActivity);

module.exports = router;
