const express = require('express');
const router = express.Router();
const { 
  registerForEvent, 
  getMyRegistrations, 
  cancelRegistration,
  getEventAttendees,
  exportEventAttendees  // ADD THIS
} = require('../controllers/registrationController');
const { protect, authorize } = require('../middleware/auth');

// Student routes
router.post('/', protect, authorize('student'), registerForEvent);
router.get('/my-registrations', protect, getMyRegistrations);
router.delete('/:id', protect, cancelRegistration);

// Manager routes
router.get('/event/:eventId', protect, authorize('manager', 'admin'), getEventAttendees);
router.get('/event/:eventId/export', protect, authorize('manager', 'admin'), exportEventAttendees);  // ADD THIS

module.exports = router;
