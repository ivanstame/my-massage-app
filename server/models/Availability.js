const mongoose = require('mongoose');

const AvailabilitySchema = new mongoose.Schema({
  date: { type: Date, required: true },
  start: { type: String, required: true },
  end: { type: String, required: true },
  type: { type: String, enum: ['autobook', 'unavailable'], required: true },
  availableSlots: [{ type: String }] // New field to store available 30-minute slots
});

module.exports = mongoose.model('Availability', AvailabilitySchema);