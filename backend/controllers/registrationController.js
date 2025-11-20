const Registration = require('../models/Registration');
const Event = require('../models/Event');
const QRCode = require('qrcode');

// Register for event (with reactivation logic)
exports.registerForEvent = async (req, res) => {
  try {
    const { eventId } = req.body;
    
    const event = await Event.findById(eventId);
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    if (event.status !== 'open') {
      return res.status(400).json({ success: false, message: 'Event registrations are closed' });
    }
    
    if (event.currentRegistrations >= event.maxParticipants) {
      return res.status(400).json({ success: false, message: 'Event is full' });
    }
    
    // FIXED: Check for ANY existing registration (including cancelled)
    const existingRegistration = await Registration.findOne({
      user: req.user._id,
      event: eventId
    });
    
    // If user has a cancelled registration, reactivate it
    if (existingRegistration) {
      if (existingRegistration.status === 'cancelled') {
        // Reactivate the cancelled registration
        existingRegistration.status = 'registered';
        existingRegistration.registeredAt = new Date(); // Update timestamp
        
        // Regenerate QR code
        const qrData = JSON.stringify({ 
          userId: req.user._id, 
          eventId: eventId, 
          registrationTime: new Date() 
        });
        existingRegistration.qrCode = await QRCode.toDataURL(qrData);
        
        await existingRegistration.save();
        
        // Increment event registrations
        event.currentRegistrations += 1;
        await event.save();
        
        await existingRegistration.populate('event', 'title date time venue');
        await existingRegistration.populate('user', 'name email');
        
        return res.status(200).json({ 
          success: true, 
          message: 'Successfully registered for event', 
          registration: existingRegistration 
        });
      } else {
        // Already actively registered
        return res.status(400).json({ 
          success: false, 
          message: 'You are already registered for this event' 
        });
      }
    }
    
    // No existing registration - create new one
    const qrData = JSON.stringify({ 
      userId: req.user._id, 
      eventId: eventId, 
      registrationTime: new Date() 
    });
    const qrCodeUrl = await QRCode.toDataURL(qrData);
    
    const registration = await Registration.create({
      user: req.user._id,
      event: eventId,
      qrCode: qrCodeUrl,
      status: 'registered'
    });
    
    event.currentRegistrations += 1;
    await event.save();
    
    await registration.populate('event', 'title date time venue');
    await registration.populate('user', 'name email');
    
    res.status(201).json({ 
      success: true, 
      message: 'Successfully registered for event', 
      registration 
    });
    
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error registering for event', 
      error: error.message 
    });
  }
};

// Get user's registrations (only active ones)
exports.getMyRegistrations = async (req, res) => {
  try {
    const registrations = await Registration.find({ 
      user: req.user._id, 
      status: { $ne: 'cancelled' } 
    })
    .populate('event')
    .sort({ registeredAt: -1 });
    
    res.status(200).json({ 
      success: true, 
      count: registrations.length, 
      registrations 
    });
    
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error fetching registrations' });
  }
};

// Cancel registration
exports.cancelRegistration = async (req, res) => {
  try {
    const registration = await Registration.findById(req.params.id);
    
    if (!registration) {
      return res.status(404).json({ success: false, message: 'Registration not found' });
    }
    
    if (registration.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    if (registration.status === 'cancelled') {
      return res.status(400).json({ success: false, message: 'Registration already cancelled' });
    }
    
    registration.status = 'cancelled';
    await registration.save();
    
    const event = await Event.findById(registration.event);
    if (event) {
      event.currentRegistrations = Math.max(0, event.currentRegistrations - 1);
      await event.save();
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Registration cancelled successfully' 
    });
    
  } catch (error) {
    console.error('Cancel error:', error);
    res.status(500).json({ success: false, message: 'Error cancelling registration' });
  }
};

// Get event attendees (Manager only)
exports.getEventAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized to view attendees' });
    }
    
    const registrations = await Registration.find({ 
      event: req.params.eventId, 
      status: { $ne: 'cancelled' } 
    })
    .populate('user', 'name email rollNumber department phone')
    .sort({ registeredAt: -1 });
    
    const attendees = registrations.map(reg => ({
      name: reg.user?.name || 'N/A',
      email: reg.user?.email || 'N/A',
      rollNumber: reg.user?.rollNumber || 'N/A',
      department: reg.user?.department || 'N/A',
      eventName: event.title,
      registeredAt: reg.registeredAt,
      status: reg.attended ? 'attended' : 'registered',
      qrCode: reg.qrCode
    }));
    
    res.status(200).json({ 
      success: true, 
      count: attendees.length, 
      attendees 
    });
    
  } catch (error) {
    console.error('Get attendees error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error fetching attendees',
      error: error.message 
    });
  }
};

// Export attendees as CSV
exports.exportEventAttendees = async (req, res) => {
  try {
    const event = await Event.findById(req.params.eventId);
    
    if (!event) {
      return res.status(404).json({ success: false, message: 'Event not found' });
    }
    
    if (req.user.role !== 'manager' && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    
    const registrations = await Registration.find({ 
      event: req.params.eventId, 
      status: { $ne: 'cancelled' } 
    })
    .populate('user', 'name email rollNumber department phone')
    .sort({ registeredAt: -1 });
    
    // Format data for CSV
    const csvData = registrations.map((reg, index) => ({
      'S.No': index + 1,
      'Name': reg.user?.name || 'N/A',
      'Email': reg.user?.email || 'N/A',
      'Roll Number': reg.user?.rollNumber || 'N/A',
      'Department': reg.user?.department || 'N/A',
      'Phone': reg.user?.phone || 'N/A',
      'Registration Date': new Date(reg.registeredAt).toLocaleDateString('en-IN'),
      'Registration Time': new Date(reg.registeredAt).toLocaleTimeString('en-IN'),
      'Status': reg.attended ? 'Attended' : 'Registered'
    }));
    
    res.status(200).json({ 
      success: true, 
      event: {
        title: event.title,
        date: event.date,
        venue: event.venue
      },
      count: csvData.length, 
      attendees: csvData 
    });
    
  } catch (error) {
    console.error('Export attendees error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error exporting attendees',
      error: error.message 
    });
  }
};
