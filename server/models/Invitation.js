const mongoose = require('mongoose');

const InvitationSchema = new mongoose.Schema({
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true
  },
  token: {
    type: String,
    required: true,
    unique: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACCEPTED', 'EXPIRED'],
    default: 'PENDING'
  },
  expires: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: '7d' // MongoDB TTL index
  }
});

module.exports = mongoose.model('Invitation', InvitationSchema);
