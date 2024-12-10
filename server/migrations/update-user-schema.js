// migrations/update-user-schema.js
const mongoose = require('mongoose');
const User = require('../models/User');

async function migrationScript() {
  try {
    // Connect to your database
    await mongoose.connect('mongodb://localhost:27017/massage_booking_app', {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('Connected to database...');

    // Get all users
    const users = await User.find({});
    console.log(`Found ${users.length} users to update...`);

    for (const user of users) {
      // Store old address if it exists
      const oldAddress = user.profile?.address;

      // Initialize new profile structure
      user.profile = {
        ...user.profile,
        address: {
          street: '',
          unit: '',
          city: '',
          state: '',
          zip: ''
        },
        emergencyContact: {
          name: '',
          phone: ''
        },
        treatmentPreferences: {
          bodyAreas: new Map()
        }
      };

      // If there was an old address, store it in notes
      if (oldAddress) {
        user.profile.address.street = oldAddress;
      }

      // Remove deprecated fields
      delete user.profile.pressurePreference;
      delete user.profile.injuryHistory;
      delete user.profile.preferredAromatherapy;

      // Save updated user
      await user.save();
      console.log(`Updated user: ${user.email}`);
    }

    console.log('Migration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrationScript();