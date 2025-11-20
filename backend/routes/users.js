const express = require('express');
const router = express.Router();
const { getAllUsers, getUserStats } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

// Manager/Admin routes
router.get('/', protect, authorize('manager', 'admin'), getAllUsers);

// User routes
router.get('/stats', protect, getUserStats);

module.exports = router;
