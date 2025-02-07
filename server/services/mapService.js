const axios = require('axios');
const { User } = require('../models/User');

const TRAFFIC_THRESHOLD_KM = 40; // Adjust this value as needed

const isWithinServiceArea = (origin, destination, serviceArea) => {
  if (!serviceArea || !serviceArea.radius || !serviceArea.center) {
    return true; // No service area restrictions
  }

  // Calculate distance from service area center to destination
  const R = 6371; // Earth's radius in km
  const lat1 = serviceArea.center.lat * Math.PI / 180;
  const lat2 = destination.lat * Math.PI / 180;
  const dLat = (destination.lat - serviceArea.center.lat) * Math.PI / 180;
  const dLon = (destination.lng - serviceArea.center.lng) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(lat1) * Math.cos(lat2) * 
           Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance <= serviceArea.radius;
};

async function validateProviderTravel(origin, destination, providerId) {
  try {
    const provider = await User.findById(providerId);
    if (!provider || provider.accountType !== 'PROVIDER') {
      throw new Error('Invalid provider');
    }

    const serviceArea = provider.providerProfile?.serviceArea;
    if (!isWithinServiceArea(origin, destination, serviceArea)) {
      throw new Error('Location is outside provider service area');
    }

    return true;
  } catch (error) {
    console.error('Provider travel validation error:', error);
    throw error;
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
      await validateProviderTravel(origin, destination, providerId);
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
