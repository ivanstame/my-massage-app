const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Availability = require('../models/Availability');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/passportMiddleware');
const { getAvailableTimeSlots } = require('../utils/timeUtils');
const { calculateTravelTime } = require('../services/mapService');

// POST / (Create a new booking)
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    console.log('Booking creation request received with data:', req.body);

    const { date, time, duration, location } = req.body;

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

    // Get existing bookings for the day
    const existingBookings = await Booking.find({
      date: bookingDate
    }).sort({ startTime: 1 });

    // Check if the slot is still available
    const availableSlots = await getAvailableTimeSlots(
      availability,
      existingBookings,
      location,
      duration,
      15 // Buffer time
    );

    const isSlotAvailable = availableSlots.some(slot => 
      slot.getTime() === startTime.getTime()
    );

    if (!isSlotAvailable) {
      return res.status(400).json({ message: 'This time slot is no longer available' });
    }

    const booking = new Booking({
      date: bookingDate,
      startTime: startTime.toTimeString().slice(0, 5),
      endTime: endTime.toTimeString().slice(0, 5),
      duration,
      location,
      client: req.user.id
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

// GET / (Fetch all bookings)
router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    console.log(`Booking retrieval request for user ID: ${req.user.id}`);

    let bookings;
    if (req.user.isAdmin) {
      const query = {};
      if (req.query.date) {
        const startDate = new Date(req.query.date);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + 1);
        query.date = { $gte: startDate, $lt: endDate };
      }
      bookings = await Booking.find(query).populate('client', 'email profile.fullName');
      console.log(`Admin retrieved ${bookings.length} bookings.`);
    } else {
      bookings = await Booking.find({ client: req.user.id });
      console.log(`User ${req.user.id} retrieved ${bookings.length} bookings.`);
    }

    res.json(bookings);
  } catch (error) {
    console.error(`Error fetching bookings for user ${req.user.id}:`, error.message);
    res.status(500).json({ message: `Error fetching bookings: ${error.message}` });
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