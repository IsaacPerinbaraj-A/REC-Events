const Event = require('../models/Event');
const Registration = require('../models/Registration');

// @desc Get all events
// @route GET /api/events
// @access Public/Private
exports.getAllEvents = async (req, res) => {
  try {
    const { category, status, search, sortBy } = req.query;

    let query = {};

    // Filter by category
    if (category && category !== 'all') {
      query.category = category;
    } // ✅ FIXED

    // Filter by status
    if (status && status !== 'all') {
      query.status = status;
    } 
    /*else {
      query.status = 'open';
    } */// ✅ FIXED

    // Search
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { organizer: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    } // ✅ FIXED

    // Sort
    let sortOptions = {};
    switch (sortBy) {
      case 'date':
        sortOptions = { date: 1 };
        break;
      case 'popularity':
        sortOptions = { currentRegistrations: -1 };
        break;
      case 'availability':
        sortOptions = { currentRegistrations: 1 };
        break;
      default:
        sortOptions = { createdAt: -1 };
    } // ✅ FIXED

    const events = await Event.find(query)
      .sort(sortOptions)
      .populate('createdBy', 'name email');

    // Mark registered events
    if (req.user) {
      const userRegistrations = await Registration.find({
        user: req.user.id,
        status: { $ne: 'cancelled' }
      }).select('event');

      const registeredEventIds = userRegistrations.map(reg => reg.event.toString());

      const eventsWithRegistrationStatus = events.map(event => ({
        ...event.toObject(),
        isRegistered: registeredEventIds.includes(event._id.toString())
      }));

      return res.status(200).json({
        success: true,
        count: eventsWithRegistrationStatus.length,
        events: eventsWithRegistrationStatus
      });
    } // ✅ FIXED

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching events'
    });
  } // ✅ FIXED
};

// @desc Get single event
// @route GET /api/events/:id
// @access Public
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'name email');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    } // ✅ FIXED

    let isRegistered = false;
    if (req.user) {
      const registration = await Registration.findOne({
        user: req.user.id,
        event: event._id,
        status: { $ne: 'cancelled' }
      });
      isRegistered = !!registration;
    } // ✅ FIXED

    res.status(200).json({
      success: true,
      event: {
        ...event.toObject(),
        isRegistered
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching event'
    });
  } // ✅ FIXED
};

// @desc Create event
// @route POST /api/events
// @access Private/Manager
exports.createEvent = async (req, res) => {
  try {
    const {
      title, description, category, date, time, venue,
      maxParticipants, organizer, image, tags, department,
      duration, prerequisites
    } = req.body;

    const event = await Event.create({
      title, description, category, date, time, venue,
      maxParticipants, organizer, image,
      tags: tags ? (typeof tags === 'string' ? tags.split(',').map(tag => tag.trim()) : tags) : [],
      department, duration, prerequisites,
      createdBy: req.user.id
    });

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      event
    });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating event',
      error: error.message
    });
  } // ✅ FIXED
};

// @desc Update event
// @route PUT /api/events/:id
// @access Private/Manager
exports.updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    } // ✅ FIXED

    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    } // ✅ FIXED

    event = await Event.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating event'
    });
  } // ✅ FIXED
};

// @desc Delete event
// @route DELETE /api/events/:id
// @access Private/Manager
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    } // ✅ FIXED

    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    } // ✅ FIXED

    await Registration.deleteMany({ event: event._id });
    await event.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error deleting event'
    });
  } // ✅ FIXED
};

// @desc Get manager's events
// @route GET /api/events/manager/my-events
// @access Private/Manager
exports.getMyEvents = async (req, res) => {
  try {
    const events = await Event.find({ createdBy: req.user.id })
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: events.length,
      events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching your events'
    });
  } // ✅ FIXED
};

// @desc Close event
// @route PUT /api/events/:id/close
// @access Private/Manager
exports.closeEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    } // ✅ FIXED

    if (event.createdBy.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized'
      });
    } // ✅ FIXED

    event.status = 'closed';
    await event.save();

    res.status(200).json({
      success: true,
      message: 'Event closed successfully',
      event
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error closing event'
    });
  } // ✅ FIXED
};

// Add this new function to your eventController.js

// Reopen event registrations
exports.reopenEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    // Check authorization - only event creator or admin
    if (event.createdBy && event.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to reopen this event' });
    }
    
    if (event.status === 'open') {
      return res.status(400).json({ success: false, message: 'Event is already open' });
    }
    
    event.status = 'open';
    await event.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Event reopened successfully', 
      event 
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error reopening event', error: error.message });
  }
};
