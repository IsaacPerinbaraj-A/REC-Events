const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  event: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Event',
    required: true
  },
  status: {
    type: String,
    enum: ['registered', 'attended', 'cancelled'],
    default: 'registered'
  },
  qrCode: {
    type: String,
    default: null
  },
  checkedInAt: {
    type: Date,
    default: null
  },
  feedback: {
    rating: {
      type: Number,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      trim: true
    }
  },
  registeredAt: {
    type: Date,
    default: Date.now
  }
});

// FIXED: Create compound index but NOT unique
// This allows querying by user+event but permits re-registration after cancel
registrationSchema.index({ user: 1, event: 1 });

// FIXED: Add index on status for faster queries
registrationSchema.index({ status: 1 });

module.exports = mongoose.model('Registration', registrationSchema);
