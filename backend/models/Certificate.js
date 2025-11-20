const mongoose = require('mongoose');

const certificateSchema = new mongoose.Schema({
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
  certificateId: {
    type: String,
    unique: true,
    required: true
  },
  downloadUrl: {
    type: String,
    required: true
  },
  issuedAt: {
    type: Date,
    default: Date.now
  } // ✅ FIXED: Added closing brace
});

// Index for quick lookups
certificateSchema.index({ user: 1, event: 1 });

module.exports = mongoose.model('Certificate', certificateSchema);
