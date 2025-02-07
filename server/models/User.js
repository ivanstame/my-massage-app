// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true
  },
  password: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    enum: ['PROVIDER', 'CLIENT', 'SUPER_ADMIN'],
    required: true
  },
  providerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  providerProfile: {
    businessName: String,
    serviceArea: {
      radius: Number,
      center: {
        lat: Number,
        lng: Number
      }
    },
    subscription: {
      plan: {
        type: String,
        enum: ['BASIC', 'PRO'],
        default: 'BASIC'
      },
      status: {
        type: String,
        enum: ['ACTIVE', 'PAST_DUE', 'CANCELLED'],
        default: 'ACTIVE'
      },
      expiresAt: Date
    }
  },
  isAdmin: {
    type: Boolean,
    default: false
  },
  registrationStep: {
    type: Number,
    default: 1,
    enum: [1, 2, 3]  // Explicitly define valid steps
  },
  lastLogin: {
    type: Date,
    default: null
  },
  profile: {
    fullName: String,
    phoneNumber: String,
    address: {
      street: String,
      unit: String,
      city: String,
      state: String,
      zip: String,
      formatted: String  // Keep formatted version for backwards compatibility
    },
    emergencyContact: {
      name: String,
      phone: String
    },
    allergies: String,
    medicalConditions: String,
    treatmentPreferences: {
      bodyAreas: {
        type: Map,
        of: {
          pressure: {
            type: Number,
            min: 1,
            max: 100
          },
          conditions: [String],
          patterns: [String],
          note: String
        },
        default: new Map()
      }
    }
  }
}, {
  timestamps: true
});

// Password hashing middleware
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (err) {
    next(err);
  }
});

// Password comparison for Passport
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error(error);
  }
};

// Static method for finding by email
UserSchema.statics.findByEmail = function(email) {
  return this.findOne({ email: email.toLowerCase() });
};

// Update login timestamp
UserSchema.methods.updateLoginTimestamp = function() {
  this.lastLogin = new Date();
  return this.save();
};

// Public profile method
UserSchema.methods.getPublicProfile = function() {
  const obj = this.toObject();
  delete obj.password;
  
  // Add account type info to profile
  obj.isProvider = this.accountType === 'PROVIDER';
  obj.isClient = this.accountType === 'CLIENT';
  obj.isSuperAdmin = this.accountType === 'SUPER_ADMIN';

  // Check if treatmentPreferences and bodyAreas exist
  if (obj.profile && obj.profile.treatmentPreferences && obj.profile.treatmentPreferences.bodyAreas) {
    // Convert Map to object if it's still a Map
    if (obj.profile.treatmentPreferences.bodyAreas instanceof Map) {
      obj.profile.treatmentPreferences.bodyAreas = Object.fromEntries(obj.profile.treatmentPreferences.bodyAreas);
    }
  }

  return obj;
};



// Convert to JSON method
UserSchema.methods.toJSON = function() {
  const obj = this.toObject();
  delete obj.password;
  return obj;
};

// Enhanced Profile update method
UserSchema.methods.updateProfile = async function(profileData) {
  // Format the address
  const formattedAddress = `${profileData.street}${profileData.unit ? ' ' + profileData.unit : ''}, ${profileData.city}, ${profileData.state} ${profileData.zip}`;
  
  // Update profile with new structure
  this.profile = {
    fullName: profileData.fullName,
    phoneNumber: profileData.phoneNumber,
    address: {
      street: profileData.street || '',
      unit: profileData.unit || '',
      city: profileData.city || '',
      state: profileData.state || '',
      zip: profileData.zip || '',
      formatted: formattedAddress
    },
    emergencyContact: {
      name: profileData.emergencyContactName || '',
      phone: profileData.emergencyContactPhone || ''
    },
    allergies: profileData.allergies || '',
    medicalConditions: profileData.medicalConditions || '',
    // Preserve existing treatment preferences
    treatmentPreferences: this.profile?.treatmentPreferences || { bodyAreas: new Map() }
  };

  // Update registration step if provided
  if (profileData.registrationStep) {
    this.registrationStep = profileData.registrationStep;
  }

  // Save and return the updated document
  return await this.save();
};

// New method for updating treatment preferences
UserSchema.methods.updateTreatmentPreferences = async function(preferencesData) {
  if (!this.profile.treatmentPreferences) {
    this.profile.treatmentPreferences = { bodyAreas: new Map() };
  }

  // Update bodyAreas with new data
  this.profile.treatmentPreferences.bodyAreas = new Map(Object.entries(preferencesData.bodyAreas));

  return await this.save();
};

// Provider relationship methods
UserSchema.methods.getClients = async function() {
  return await this.model('User').find({ providerId: this._id });
};

UserSchema.methods.isProviderOf = async function(clientId) {
  const client = await this.model('User').findById(clientId);
  return client && client.providerId?.equals(this._id);
};

module.exports = mongoose.model('User', UserSchema);
