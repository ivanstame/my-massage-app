const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Availability = require('../models/Availability');
const User = require('../models/User');
const { ensureAuthenticated } = require('../middleware/passportMiddleware');
const { getAvailableTimeSlots } = require('../utils/timeUtils');
const { calculateTravelTime } = require('../services/mapService');
const { DateTime } = require('luxon');


// Calculate price helper
const calculatePrice = (duration) => {
  const BASE_RATE = 120; // $120 per hour
  return Math.ceil((duration / 60) * BASE_RATE);
};

// POST / (Create a new booking)
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    const { date, time, duration, location } = req.body;
    
    // Validate time format
    const timeFormat24h = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeFormat24h.test(time)) {
      return res.status(400).json({ message: 'Invalid time format. Use 24-hour format (HH:mm)' });
    }

    // If client is booking, use their provider
    // If provider is booking for client, use provider's ID
    const providerId = req.user.accountType === 'CLIENT' 
      ? req.user.providerId 
      : req.user._id;

    const clientId = req.user.accountType === 'CLIENT'
      ? req.user._id
      : req.body.clientId;

    // Verify provider-client relationship
    if (req.user.accountType === 'PROVIDER') {
      const client = await User.findById(clientId);
      if (!client || !client.providerId.equals(req.user._id)) {
        return res.status(403).json({ message: 'Invalid client for this provider' });
      }
    }

    const bookingDateLA = DateTime.fromISO(date, { zone: 'America/Los_Angeles' }).startOf('day');
    const bookingDate = bookingDateLA.toUTC().toJSDate();

    // Create booking start time in LA timezone
    const bookingStartTimeLA = DateTime.fromFormat(`${bookingDateLA.toFormat('yyyy-MM-dd')} ${time}`, 
      'yyyy-MM-dd HH:mm', 
      { zone: 'America/Los_Angeles' }
    );
    
    // Convert to UTC for storage
    const bookingStartTime = bookingStartTimeLA.toUTC().toJSDate();
    
    // Calculate end time
    const bookingEndTimeLA = bookingStartTimeLA.plus({ minutes: duration });
    const endTime = bookingEndTimeLA.toFormat('HH:mm');

    // Get availability for the day
    const availability = await Availability.findOne({
      localDate: bookingDateLA.toFormat('yyyy-MM-dd')
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
      15 // Default buffer minutes - TEMPORARY: Should be replaced with provider-specific value in the future
    );

    // Convert available slots to LA time strings for comparison
    const availableTimeStrings = availableSlots.map(slot => {
      const slotLA = DateTime.fromJSDate(slot).setZone('America/Los_Angeles');
      return slotLA.toFormat('HH:mm');
    });
    
    // Check if the requested time is in the available slots
    const isSlotAvailable = availableTimeStrings.includes(time);

    if (!isSlotAvailable) {
      return res.status(400).json({ message: 'This time slot is no longer available' });
    }

    // Create booking
    const booking = new Booking({
      provider: providerId,
      client: clientId,
      date: bookingDate,
      localDate: bookingDateLA.toFormat('yyyy-MM-dd'),
      startTime: time,
      endTime: endTime,
      duration,
      location: {
        lat: location.lat,
        lng: location.lng,
        address: location.address
      },
      price: calculatePrice(duration)
    });

    await booking.save();
    res.status(201).json(booking);

  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Booking creation failed' });
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
    
    // Validate time format for first request
    const timeFormat24h = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeFormat24h.test(firstRequest.time)) {
      return res.status(400).json({ message: 'Invalid time format. Use 24-hour format (HH:mm)' });
    }

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
      date: bookingDate
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
      // Create booking start time in LA timezone
      const bookingDateLA = DateTime.fromISO(request.date, { zone: 'America/Los_Angeles' }).startOf('day');
      const bookingStartTimeLA = DateTime.fromFormat(
        `${bookingDateLA.toFormat('yyyy-MM-dd')} ${request.time}`, 
        'yyyy-MM-dd HH:mm', 
        { zone: 'America/Los_Angeles' }
      );

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

      // Convert available slots to LA time strings for comparison
      const availableTimeStrings = availableSlots.map(slot => {
        const slotLA = DateTime.fromJSDate(slot).setZone('America/Los_Angeles');
        return slotLA.toFormat('HH:mm');
      });
      
      // Check if the requested time is in the available slots
      const isSlotAvailable = availableTimeStrings.includes(request.time);

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
      // Create booking start time in LA timezone
      const bookingDateLA = DateTime.fromISO(request.date, { zone: 'America/Los_Angeles' }).startOf('day');
      const bookingStartTimeLA = DateTime.fromFormat(
        `${bookingDateLA.toFormat('yyyy-MM-dd')} ${request.time}`, 
        'yyyy-MM-dd HH:mm', 
        { zone: 'America/Los_Angeles' }
      );
      
      // Convert to UTC for storage
      const bookingStartTime = bookingStartTimeLA.toUTC().toJSDate();
      
      // Calculate end time
      const bookingEndTimeLA = bookingStartTimeLA.plus({ minutes: request.duration });
      const endTime = bookingEndTimeLA.toFormat('HH:mm');
      
      const price = calculatePrice(request.duration);

      const booking = new Booking({
        provider: req.user.accountType === 'CLIENT' ? req.user.providerId : req.user._id,
        client: req.user.id,
        date: bookingDateLA.toUTC().toJSDate(),
        localDate: bookingDateLA.toFormat('yyyy-MM-dd'),
        startTime: request.time,
        endTime: endTime,
        duration: request.duration,
        location: request.location,
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


router.get('/', ensureAuthenticated, async (req, res) => {
  try {
    if (req.query.stats === 'today') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const appointments = await Booking.find({
        provider: req.user._id,
        date: {
          $gte: today,
          $lt: tomorrow
        },
        status: { $ne: 'cancelled' }
      });

      const now = new Date();
      const stats = {
        total: appointments.length,
        completed: appointments.filter(appt => {
          const endTime = new Date(appt.date);
          const [hours, minutes] = appt.endTime.split(':');
          endTime.setHours(parseInt(hours), parseInt(minutes));
          return endTime < now;
        }).length
      };
      stats.upcoming = stats.total - stats.completed;

      return res.json(stats);
    }

    // Existing booking list logic with clientId filter support
    let bookings;
    
    if (req.user.accountType === 'PROVIDER') {
      // If clientId is provided, filter bookings for that specific client
      if (req.query.clientId) {
        // Verify that the client belongs to this provider
        const client = await User.findOne({
          _id: req.query.clientId,
          providerId: req.user._id
        });
        
        if (!client) {
          return res.status(403).json({ message: 'Client not found or not associated with this provider' });
        }
        
        bookings = await Booking.find({
          provider: req.user._id,
          client: req.query.clientId
        })
        .populate('client', 'email profile.fullName clientProfile')
        .sort({ date: 1, startTime: 1 });
      } else {
        // Get all bookings for this provider's clients
        bookings = await Booking.findForProvider(req.user._id, new Date(0), new Date())
          .populate('client', 'email profile.fullName')
          .exec();
      }
    } else if (req.user.accountType === 'CLIENT') {
      // Get only client's own bookings
      bookings = await Booking.find({ client: req.user._id })
        .populate('provider', 'providerProfile.businessName');
    } else {
      return res.status(403).json({ message: 'Invalid account type' });
    }

    res.json(bookings);
  } catch (error) {
    console.error('Error fetching bookings:', error);
    res.status(500).json({ message: 'Error fetching bookings' });
  }
});

// DELETE /:id (Cancel a booking)
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Check authorization
    if (req.user.accountType === 'PROVIDER' && !booking.provider.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }
    
    if (req.user.accountType === 'CLIENT' && !booking.client.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to cancel this booking' });
    }

    await booking.remove();
    res.json({ message: 'Booking cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling booking:', error);
    res.status(500).json({ message: 'Server error while cancelling booking' });
  }
});

module.exports = router;
