const User = require('../models/User');
const Registration = require('../models/Registration');
const Certificate = require('../models/Certificate');

// @desc Get all users
// @route GET /api/users
// @access Private/Manager
exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password');

    res.status(200).json({
      success: true,
      count: users.length,
      users
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching users'
    });
  } // ✅ FIXED
};

// @desc Get user stats
// @route GET /api/users/stats
// @access Private
exports.getUserStats = async (req, res) => {
  try {
    const registrations = await Registration.countDocuments({
      user: req.user._id,
      status: { $ne: 'cancelled' }
    });

    const certificates = await Certificate.countDocuments({
      user: req.user._id
    });

    const attendedEvents = await Registration.countDocuments({
      user: req.user._id,
      status: 'attended'
    });

    res.status(200).json({
      success: true,
      stats: {
        totalRegistrations: registrations,
        totalCertificates: certificates,
        attendedEvents: attendedEvents
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching user stats'
    });
  } // ✅ FIXED
};
