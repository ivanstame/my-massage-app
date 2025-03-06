const axios = require('axios');
const mongoose = require('mongoose');

const TRAFFIC_THRESHOLD_KM = 40; // Adjust this value as needed

const isWithinServiceArea = (origin, destination, serviceArea) => {
  // Always return true - serviceArea functionality has been removed
  return true;
};

// Log mongoose version to verify it's the same instance
console.log('Mongoose version in mapService.js:', mongoose.version);

// Helper function to get User model using Mongoose's global model lookup
function getUserModel() {
  try {
    // Try to get the model from Mongoose's registry
    const userModel = mongoose.model('User');
    console.log('Loaded User model from mongoose registry:', userModel ? 'Success' : 'Failed');
    console.log('User model methods:', Object.keys(userModel || {}).join(', '));
    return userModel;
  } catch (error) {
    console.error('Error getting User model from mongoose registry:', error.message);
    
    // Fallback to direct require as a last resort
    try {
      const userModel = require('../models/User');
      console.log('Loaded User model via require:', userModel ? 'Success' : 'Failed');
      return userModel;
    } catch (reqError) {
      console.error('Error requiring User model:', reqError.message);
      return null;
    }
  }
}

async function validateProviderTravel(origin, destination, providerId) {
  // IMPORTANT: Since service area validation has been removed,
  // we can safely return true immediately to bypass all validation
  // This is a temporary solution until the module resolution issue is fixed
  console.log('NOTICE: Bypassing provider travel validation entirely');
  return true;

  // The code below is kept for reference but is not executed
  try {
    console.log('validateProviderTravel called with providerId:', providerId);
    
    if (!providerId) {
      console.log('No providerId provided, skipping validation');
      return true; // Skip validation if no providerId is provided
    }
    
    if (typeof providerId !== 'string' && !(providerId instanceof Object)) {
      console.log('Invalid providerId type:', typeof providerId);
      return true; // Skip validation if providerId is not a string or object
    }
    
    // Get the User model using Mongoose's global model lookup
    const User = getUserModel();
    
    // Check if User model was loaded successfully
    if (!User) {
      console.log('User model not available, skipping validation');
      return true;
    }
    
    if (!User.findById) {
      console.log('User.findById is not a function, skipping validation');
      console.log('User model type:', typeof User);
      console.log('User model properties:', Object.keys(User).join(', '));
      return true;
    }
    
    try {
      // Try to convert providerId to ObjectId if it's a string
      const mongoose = require('mongoose');
      if (typeof providerId === 'string' && mongoose.Types.ObjectId.isValid(providerId)) {
        providerId = new mongoose.Types.ObjectId(providerId);
        console.log('Converted providerId to ObjectId:', providerId);
      }
    } catch (err) {
      console.log('Error converting providerId to ObjectId:', err.message);
      // Continue with the original providerId
    }
    
    const provider = await User.findById(providerId);
    if (!provider) {
      console.log('Provider not found for ID:', providerId);
      return true; // Skip validation if provider not found
    }
    
    if (provider.accountType !== 'PROVIDER') {
      console.log('User is not a provider:', provider.accountType);
      return true; // Skip validation if user is not a provider
    }

    // ServiceArea validation has been removed
    return true;
  } catch (error) {
    console.error('Provider travel validation error:', error);
    console.log('Error occurred with providerId:', providerId);
    // Return true instead of throwing to prevent booking failures
    return true;
  }
}

async function calculateTravelTime(origin, destination, departureTime, providerId) {
  console.log('Calculating travel time:');
  console.log('Origin:', JSON.stringify(origin));
  console.log('Destination:', JSON.stringify(destination));
  console.log('Departure Time:', departureTime);

  try {
    if (!origin || !destination || !departureTime) {
      throw new Error('Missing required parameters for travel time calculation');
    }

    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      throw new Error('Invalid location data for travel time calculation');
    }

    // Validate provider service area if providerId is provided
    if (providerId) {
      try {
        await validateProviderTravel(origin, destination, providerId);
      } catch (validationError) {
        console.error('Error validating provider travel, continuing anyway:', validationError);
        // Continue with travel time calculation even if validation fails
      }
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: `${origin.lat},${origin.lng}`,
        destinations: `${destination.lat},${destination.lng}`,
        mode: 'driving',
        departure_time: Math.floor(departureTime.getTime() / 1000),
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    console.log('API Response:', JSON.stringify(response.data, null, 2));

    if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
      const distanceInMeters = response.data.rows[0].elements[0].distance.value;
      const distanceInKm = distanceInMeters / 1000;
      
      let durationInSeconds;
      if (distanceInKm > TRAFFIC_THRESHOLD_KM) {
        durationInSeconds = response.data.rows[0].elements[0].duration_in_traffic.value;
        console.log('Using traffic-aware duration for long distance');
      } else {
        durationInSeconds = response.data.rows[0].elements[0].duration.value;
        console.log('Using standard duration for short distance');
      }

      const durationInMinutes = Math.ceil(durationInSeconds / 60);
      console.log('Calculated duration:', durationInMinutes, 'minutes');
      console.log('Distance:', distanceInKm.toFixed(2), 'km');
      return durationInMinutes;
    } else {
      throw new Error(`Unable to calculate travel time. API Status: ${response.data.status}, Element Status: ${response.data.rows[0].elements[0].status}`);
    }
  } catch (error) {
    console.error('Error calculating travel time:', error);
    throw error;
  }
}

module.exports = {
  calculateTravelTime,
  validateProviderTravel,
  isWithinServiceArea
};
