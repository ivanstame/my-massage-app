const axios = require('axios');

const TRAFFIC_THRESHOLD_KM = 40; // Adjust this value as needed

async function calculateTravelTime(origin, destination, departureTime) {
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
  calculateTravelTime
};