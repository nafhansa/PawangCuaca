const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const adminController = require('../controllers/adminController');

router.use(authMiddleware, roleMiddleware('superadmin'));

router.get('/users', adminController.getUsers);
router.get('/stats', adminController.getStats);
router.put('/users/:id/approve', adminController.approveUser);
router.put('/users/:id/reject', adminController.rejectUser);
router.delete('/users/:id', adminController.deleteUser);

module.exports = router;
