const mongoose = require('mongoose');
const User = require('../models/User');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/massage-app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
})
.then(() => console.log('Connected to database...'))
.catch(err => {
  console.error('Database connection error:', err);
  process.exit(1);
});

const migrateUsers = async () => {
  try {
    // Find all client users
    const clients = await User.find({ accountType: 'CLIENT' });
    console.log(`Found ${clients.length} client users in the database...`);

    // Log all client emails for debugging
    if (clients.length > 0) {
      console.log('Client emails:');
      clients.forEach(client => {
        console.log(`- ${client.email} (has clientProfile: ${client.clientProfile ? 'yes' : 'no'})`);
      });
    } else {
      console.log('No clients found in the database.');
    }

    let updatedCount = 0;
    let skippedCount = 0;

    // Update each client with the new clientProfile field
    for (const client of clients) {
      // Skip if clientProfile already exists
      if (client.clientProfile) {
        console.log(`Client ${client.email} already has clientProfile, skipping...`);
        console.log(`Current clientProfile: ${JSON.stringify(client.clientProfile)}`);
        skippedCount++;
        continue;
      }

      // Add clientProfile field
      client.clientProfile = {
        notes: '',
        preferences: {},
        stats: {
          totalAppointments: 0,
          upcomingAppointments: 0,
          completedAppointments: 0,
          totalRevenue: 0
        }
      };

      // Save the updated user
      await client.save();
      console.log(`Updated user: ${client.email}`);
      updatedCount++;
    }

    console.log(`\nMigration summary:`);
    console.log(`- Total clients: ${clients.length}`);
    console.log(`- Updated clients: ${updatedCount}`);
    console.log(`- Skipped clients (already had clientProfile): ${skippedCount}`);
    console.log('\nMigration completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
};

// Run the migration
migrateUsers();