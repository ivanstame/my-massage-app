const express = require('express');
const router = express.Router();
const axios = require('axios');
const { ensureAuthenticated } = require('../middleware/passportMiddleware');

// Get coordinates from address using Google Maps Geocoding API
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    const { address } = req.query;
    if (!address) {
      return res.status(400).json({ message: 'Address is required' });
    }

    const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
    if (!GOOGLE_MAPS_API_KEY) {
      throw new Error('Google Maps API key not configured');
    }

    const response = await axios.get(
      `https://maps.googleapis.com/maps/api/geocode/json`,
      {
        params: {
          address,
          key: GOOGLE_MAPS_API_KEY
        }
      }
    );

    // Log the complete Google Maps API response for debugging
    console.log('Google Maps API Response:', JSON.stringify(response.data, null, 2));

    if (response.data.status === 'OK' && response.data.results.length > 0) {
      const { lat, lng } = response.data.results[0].geometry.location;
      res.json({ lat, lng });
    } else {
      // Handle specific Google Maps API error status codes
      switch (response.data.status) {
        case 'ZERO_RESULTS':
          res.status(404).json({ message: 'No results found for this address. Please check the address and try again.' });
          break;
        case 'OVER_QUERY_LIMIT':
          console.error('Google Maps API quota exceeded');
          res.status(429).json({ message: 'Service temporarily unavailable. Please try again later.' });
          break;
        case 'REQUEST_DENIED':
          console.error('Google Maps API request denied - likely an API key issue');
          res.status(403).json({ message: 'Address verification service is currently unavailable.' });
          break;
        case 'INVALID_REQUEST':
          res.status(400).json({ message: 'Invalid address format. Please check all address fields.' });
          break;
        default:
          res.status(404).json({ 
            message: 'Could not verify address',
            status: response.data.status
          });
      }
    }
  } catch (error) {
    console.error('Geocoding error:', error.response?.data || error.message);
    
    // Handle network errors and API errors differently
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      res.status(error.response.status).json({
        message: 'Error verifying address',
        error: error.response.data.error_message || error.message
      });
    } else if (error.request) {
      // The request was made but no response was received
      res.status(503).json({
        message: 'Unable to reach address verification service. Please try again later.',
        error: 'NETWORK_ERROR'
      });
    } else {
      // Something happened in setting up the request
      res.status(500).json({
        message: 'Internal server error while verifying address',
        error: error.message
      });
    }
  }
});

module.exports = router;
