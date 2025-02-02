const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: { type: Date, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  type: { type: String, enum: ['autobook', 'unavailable'], required: true },
  availableSlots: [{ type: String }] // New field to store available 30-minute slots
});

// Compound index for provider-date queries
AvailabilitySchema.index({ provider: 1, date: 1 });

// Find availability for a specific provider
AvailabilitySchema.statics.findForProvider = function(providerId, startDate, endDate) {
  const query = { provider: providerId };
  if (startDate && endDate) {
    query.date = { 
      $gte: startDate, 
      $lte: endDate 
    };
  }
  return this.find(query).sort({ date: 1, start: 1 });
};

module.exports = mongoose.model('Availability', AvailabilitySchema);
