const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LocationSchema = new Schema({
  lat: {
    type: Number,
    required: true,
    min: -90,
    max: 90,
    validate: {
      validator: Number.isFinite,
      message: 'Latitude must be a valid number'
    }
  },
  lng: {
    type: Number,
    required: true,
    min: -180,
    max: 180,
    validate: {
      validator: Number.isFinite,
      message: 'Longitude must be a valid number'
    }
  },
  address: { 
    type: String, 
    required: [true, 'Address is required'],
    trim: true
  }
});

const MassageAreaSchema = new Schema({
  area: {
    type: String,
    required: [true, 'Body area must be specified'],
    enum: [
      'leftShoulder', 'rightShoulder',
      'leftUpperBack', 'rightUpperBack',
      'leftLowerBack', 'rightLowerBack',
      'leftNeck', 'rightNeck',
      'leftArm', 'rightArm',
      'leftLeg', 'rightLeg',
      'leftFoot', 'rightFoot',
      'upperBack', 'middleBack', 'lowerBack',
      'neck', 'head', 'glutes',
      'leftHip', 'rightHip'
    ]
  },
  priority: {
    type: Number,
    required: [true, 'Priority level must be specified'],
    min: [1, 'Priority must be at least 1'],
    max: [3, 'Priority cannot exceed 3']
  },
  notes: {
    type: String,
    trim: true,
    maxlength: [200, 'Notes cannot exceed 200 characters']
  }
});

const BookingSchema = new Schema({
  client: { 
    type: Schema.Types.ObjectId, 
    ref: 'User', 
    required: [true, 'Client reference is required']
  },
  groupId: {
    type: String,
    default: null
  },
  therapist: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  date: { 
    type: Date, 
    required: [true, 'Booking date is required']
  },
  startTime: { 
    type: String, 
    required: [true, 'Start time is required'],
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM`
    }
  },
  endTime: { 
    type: String, 
    required: [true, 'End time is required'],
    validate: {
      validator: function(v) {
        return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
      },
      message: props => `${props.value} is not a valid time format! Use HH:MM`
    }
  },
  duration: { 
    type: Number, 
    required: [true, 'Duration is required'],
    min: [30, 'Duration must be at least 30 minutes'],
    max: [180, 'Duration cannot exceed 180 minutes']
  },
  location: {
    type: LocationSchema,
    required: [true, 'Location details are required']
  },
  massageAreas: {
    type: [MassageAreaSchema],
    validate: [
      {
        validator: function(areas) {
          return areas.length <= 10;
        },
        message: 'Cannot specify more than 10 massage areas'
      }
    ],
    default: []
  },
  pressurePreference: {
    type: String,
    enum: {
      values: ['light', 'medium', 'firm'],
      message: '{VALUE} is not a valid pressure preference'
    }
  },
  specialRequests: {
    type: String,
    trim: true,
    maxlength: [500, 'Special requests cannot exceed 500 characters']
  },
  breakdownTime: { 
    type: Number, 
    default: 15,
    min: [5, 'Breakdown time must be at least 5 minutes'],
    max: [30, 'Breakdown time cannot exceed 30 minutes']
  },
  status: { 
    type: String, 
    enum: {
      values: ['pending', 'confirmed', 'in-progress', 'completed', 'cancelled'],
      message: '{VALUE} is not a valid status'
    },
    default: 'pending'
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: [200, 'Cancellation reason cannot exceed 200 characters']
  },
  travelTimeToNext: { 
    type: Number,
    min: [0, 'Travel time cannot be negative']
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  paymentStatus: {
    type: String,
    enum: {
      values: ['pending', 'completed', 'refunded'],
      message: '{VALUE} is not a valid payment status'
    },
    default: 'pending'
  },
  clientNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Client notes cannot exceed 500 characters']
  },
  therapistNotes: {
    type: String,
    trim: true,
    maxlength: [500, 'Therapist notes cannot exceed 500 characters']
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
BookingSchema.index({ client: 1, date: 1 });
BookingSchema.index({ therapist: 1, date: 1 });
BookingSchema.index({ date: 1, status: 1 });
BookingSchema.index({ 'location.lat': 1, 'location.lng': 1 });

// Virtual for full appointment duration (including breakdown time)
BookingSchema.virtual('totalDuration').get(function() {
  return this.duration + this.breakdownTime;
});

// Pre-save middleware
BookingSchema.pre('save', function(next) {
  // Ensure endTime is calculated correctly based on startTime and duration
  if (this.startTime && this.duration) {
    const [hours, minutes] = this.startTime.split(':').map(Number);
    const startMinutes = hours * 60 + minutes;
    const endMinutes = startMinutes + this.duration;
    const endHours = Math.floor(endMinutes / 60);
    const remainingMinutes = endMinutes % 60;
    this.endTime = `${String(endHours).padStart(2, '0')}:${String(remainingMinutes).padStart(2, '0')}`;
  }
  next();
});

// Statics
BookingSchema.statics.findOverlapping = function(startTime, endTime, therapistId) {
  return this.find({
    therapist: therapistId,
    $or: [
      {
        startTime: { $lt: endTime },
        endTime: { $gt: startTime }
      }
    ],
    status: { $nin: ['cancelled', 'completed'] }
  });
};

// Methods
BookingSchema.methods.cancel = function(reason) {
  this.status = 'cancelled';
  this.cancellationReason = reason;
  return this.save();
};

BookingSchema.methods.complete = function(therapistNotes) {
  this.status = 'completed';
  if (therapistNotes) {
    this.therapistNotes = therapistNotes;
  }
  return this.save();
};

const Booking = mongoose.model('Booking', BookingSchema);

// Add error handling wrapper
Booking.createSafe = async function(bookingData) {
  try {
    const booking = new Booking(bookingData);
    await booking.save();
    return { success: true, booking };
  } catch (error) {
    return { 
      success: false, 
      error: error.message,
      validationErrors: error.errors 
    };
  }
};

module.exports = Booking;