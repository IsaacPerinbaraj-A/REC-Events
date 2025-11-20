const express = require('express');
const router = express.Router();
const {
  getAllEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
  getMyEvents,
  closeEvent,
  reopenEvent
} = require('../controllers/eventController');
const { protect, authorize } = require('../middleware/auth');

// Public routes (anyone can view events)
router.get('/', getAllEvents);
router.get('/:id', getEventById);

// Manager-only routes
router.post('/', protect, authorize('manager', 'admin'), createEvent);
router.put('/:id', protect, authorize('manager', 'admin'), updateEvent);
router.delete('/:id', protect, authorize('manager', 'admin'), deleteEvent);
router.get('/manager/my-events', protect, authorize('manager', 'admin'), getMyEvents);
router.put('/:id/close', protect, authorize('manager', 'admin'), closeEvent);
router.put('/:id/reopen', protect, authorize('manager', 'admin'), reopenEvent);

module.exports = router;
