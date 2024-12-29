const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Availability = require('../models/Availability');
const { ensureAuthenticated } = require('../middleware/passportMiddleware');
const { getAvailableTimeSlots } = require('../utils/timeUtils');
const { calculateTravelTime } = require('../services/mapService');

// Calculate price helper
const calculatePrice = (duration) => {
  const BASE_RATE = 120; // $120 per hour
  return Math.ceil((duration / 60) * BASE_RATE);
};

// POST / (Create a new booking)
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    console.log('Booking creation request received with data:', req.body);

    // Add groupId and isLastInGroup to destructuring if you want them from front-end
    const { date, time, duration, location, groupId, isLastInGroup } = req.body;

    // Check for authenticated user
    if (!req.user || !req.user.id) {
      console.error('No user ID found in the request');
      return res.status(401).json({ message: 'Unauthorized: No user ID found' });
    }

    const bookingDate = new Date(date);
    console.log('Parsed booking date:', bookingDate);

    const startTime = new Date(`${date}T${time}`);
    const endTime = new Date(startTime.getTime() + duration * 60000);
    console.log('Checking availability for:', bookingDate, startTime, endTime);

    // Get admin availability for the day
    const availability = await Availability.findOne({
      date: bookingDate,
      type: 'autobook'
    });

    if (!availability) {
      return res.status(400).json({ message: 'No availability for the selected date' });
    }

    // Get existing bookings
    const existingBookings = await Booking.find({
      date: bookingDate
    }).sort({ startTime: 1 });

    // Check if the slot is still available
    const availableSlots = await getAvailableTimeSlots(
      availability,
      existingBookings,
      location,
      duration,
      15,       // default buffer
      groupId   // pass groupId for group-based buffer logic
    );

    const isSlotAvailable = availableSlots.some(
      slot => slot.getTime() === startTime.getTime()
    );

    if (!isSlotAvailable) {
      return res.status(400).json({ message: 'This time slot is no longer available' });
    }

    // Price calculation
    const price = calculatePrice(duration);
    console.log('Calculated price for duration', duration, 'minutes:', price);

    // Create booking
    const booking = new Booking({
      date: bookingDate,
      startTime: startTime.toTimeString().slice(0, 5),
      endTime: endTime.toTimeString().slice(0, 5),
      duration,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: location.address
      },
      client: req.user.id,
      price,
      // add groupId if present
      groupId: groupId || null,
      // track if this is the last booking in the group
      isLastInGroup: !!isLastInGroup
    });

    console.log('Attempting to save booking for user ID:', req.user.id);

    await booking.save();
    console.log('Booking successfully saved:', booking);

    res.status(201).json(booking);

  } catch (error) {
    console.error('Error creating booking:', error.message);
    res.status(500).json({ message: `Booking creation failed: ${error.message}` });
  }
});

// bookings.js (Bulk Endpoint)

router.post('/bulk', ensureAuthenticated, async (req, res) => {
  try {
    const bookingRequests = req.body;
    if (!Array.isArray(bookingRequests) || bookingRequests.length === 0) {
      console.error('Bulk booking failed: Expected array of booking requests');
      return res.status(400).json({ message: 'Expected array of booking requests' });
    }

    // Check for authenticated user
    if (!req.user || !req.user.id) {
      console.error('Bulk booking failed: No user ID found in the request');
      return res.status(401).json({ message: 'Unauthorized: No user ID found' });
    }

    // Validate all bookings are for the same date and location
    const firstRequest = bookingRequests[0];
    const allSameDate = bookingRequests.every(req => req.date === firstRequest.date);
    const allSameLocation = bookingRequests.every(req => 
      req.location.address === firstRequest.location.address &&
      req.location.lat === firstRequest.location.lat &&
      req.location.lng === firstRequest.location.lng
    );

    if (!allSameDate || !allSameLocation) {
      console.error('Bulk booking failed: All bookings must have the same date and location');
      return res.status(400).json({ 
        message: 'All bookings in a group must be for the same date and location' 
      });
    }

    const bookingDate = new Date(firstRequest.date);
    
    // Get admin availability once for the date
    const availability = await Availability.findOne({
      date: bookingDate,
      type: 'autobook'
    });

    if (!availability) {
      console.error('Bulk booking failed: No availability for the selected date');
      return res.status(400).json({ message: 'No availability for the selected date' });
    }

    // Get existing bookings once
    const existingBookings = await Booking.find({
      date: bookingDate
    }).sort({ startTime: 1 });

    // Validate all slots are available
    const validationPromises = bookingRequests.map(async (request, index) => {
      const startTime = new Date(`${request.date}T${request.time}`);
      const endTime = new Date(startTime.getTime() + request.duration * 60000);

      // Pass groupId and extraDepartureBuffer to availability check
      const availableSlots = await getAvailableTimeSlots(
        availability,
        existingBookings,
        request.location,
        request.duration,
        15,
        request.groupId,
        request.extraDepartureBuffer
      );

      const isSlotAvailable = availableSlots.some(slot => 
        slot.getTime() === startTime.getTime()
      );

      if (!isSlotAvailable) {
        console.error(`Bulk booking failed: Slot not available for session ${index + 1}`);
        throw new Error(`Slot not available for session ${index + 1}`);
      }
    });

    try {
      await Promise.all(validationPromises);
    } catch (error) {
      // The specific error message will be sent to the front end
      console.error(`Bulk booking validation error: ${error.message}`);
      return res.status(400).json({ message: error.message });
    }

    // Create all bookings
    const bookingPromises = bookingRequests.map((request, index) => {
      const startTime = new Date(`${request.date}T${request.time}`);
      const endTime = new Date(startTime.getTime() + request.duration * 60000);
      
      const price = calculatePrice(request.duration);

      const booking = new Booking({
        date: bookingDate,
        startTime: startTime.toTimeString().slice(0, 5),
        endTime: endTime.toTimeString().slice(0, 5),
        duration: request.duration,
        location: request.location,
        client: req.user.id,
        price,
        groupId: request.groupId,
        isLastInGroup: index === bookingRequests.length - 1,
        extraDepartureBuffer: request.extraDepartureBuffer
      });

      return booking.save();
    });

    const savedBookings = await Promise.all(bookingPromises);
    console.log('Bulk bookings successfully created:', savedBookings);
    res.status(201).json(savedBookings);

  } catch (error) {
    console.error('Error creating bulk bookings:', error.message);
    res.status(500).json({ message: `Bulk booking creation failed: ${error.message}` });
  }
});


// GET / (Fetch all bookings)
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    let bookings;
    if (req.user.isAdmin) {
      // Admin sees all
      const query = req.query.date
        ? {
            date: {
              $gte: new Date(req.query.date),
              $lt: new Date(
                new Date(req.query.date).setDate(
                  new Date(req.query.date).getDate() + 1
                )
              )
            }
          }
        : {};
      bookings = await Booking.find(query).populate('client', 'email profile.fullName');
    } else {
      // Normal user sees only their own
      bookings = await Booking.find({ client: req.user.id });
    }
    res.json(bookings);
  } catch (error) {
    console.error('Time itself has become uncertain:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// DELETE /:id (Cancel a booking)
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    console.log(`Attempting to delete booking with ID: ${req.params.id}`);
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      console.log('Booking not found');
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (!req.user.isAdmin && booking.client.toString() !== req.user.id) {
      console.log('Unauthorized cancellation attempt');
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    await booking.remove();
    console.log('Booking successfully cancelled');
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error while cancelling booking' });
  }
});

module.exports = router;
