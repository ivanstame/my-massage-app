const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const { ensureAuthenticated, ensureAdmin, ensureProvider } = require('../middleware/passportMiddleware');
const { getAvailableTimeSlots } = require('../utils/timeUtils');

// Get availability blocks for a specific date
router.get('/blocks/:date', ensureAuthenticated, async (req, res) => {
  try {
    const laDate = DateTime.fromISO(req.params.date, { zone: 'America/Los_Angeles' });
    
    const blocks = await Availability.find({
      provider: req.user._id, // Filter by logged-in provider
      localDate: laDate.toFormat('yyyy-MM-dd')
    });

    res.json(blocks);
  } catch (error) {
    console.error('Error fetching availability blocks:', error);
    res.status(500).json({ message: 'Error fetching availability' });
  }
});

// Get availability block for spans of a month at a time
router.get('/month/:year/:month', ensureAuthenticated, async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0);

    const availabilityBlocks = await Availability.find({
      date: {
        $gte: startDate,
        $lte: endDate
      },
      type: 'autobook'
    }).sort({ date: 1 });

    res.json(availabilityBlocks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new availability
router.post('/', ensureAuthenticated, async (req, res) => {
  try {
    // Ensure provider is setting their own availability
    if (req.user.accountType !== 'PROVIDER') {
      return res.status(403).json({ message: 'Only providers can set availability' });
    }

    const newAvailability = new Availability({
      ...req.body,
      provider: req.user._id // Force provider ID from session
    });

    await newAvailability.save();
    res.status(201).json(newAvailability);
  } catch (error) {
    console.error('Error creating availability:', error);
    res.status(500).json({ message: 'Availability creation failed' });
  }
});

// Update availability (admin only)
router.put('/:id', ensureAdmin, async (req, res) => {
  try {
    const block = await Availability.findById(req.params.id);
    if (!block) {
      return res.status(404).json({ message: 'Availability block not found' });
    }

    const { start, end, type } = req.body;

    const { hasConflicts, bookings } = await checkBookingConflicts(
      block.date,
      start,
      end,
      block._id
    );

    if (hasConflicts) {
      return res.status(400).json({
        message: 'Cannot modify: Would affect existing appointments',
        conflicts: bookings
      });
    }

    block.start = start;
    block.end = end;
    block.type = type;

    await block.save();
    res.json(block);
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(400).json({ message: error.message });
  }
});

// Delete availability block
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.id);
    
    // Verify ownership
    if (!availability.provider.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized to modify this availability' });
    }

    await availability.remove();
    res.json({ message: 'Availability removed successfully' });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ message: 'Server error deleting availability' });
  }
});

// Get available slots for a specific date
router.get('/available/:date', async (req, res) => {
  try {
    const requestedDate = new Date(req.params.date);
    if (isNaN(requestedDate)) {
      return res.status(400).json({ message: 'Invalid date format' });
    }
    const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(requestedDate.setHours(23, 59, 59, 999));

    console.log('Searching for availability between:', startOfDay, 'and', endOfDay);

    // Parse duration(s) from request
    const isMultiSession = req.query.sessionDurations ? true : false;
    const appointmentDuration = isMultiSession 
      ? JSON.parse(req.query.sessionDurations)  // Will be array for multi-session
      : parseInt(req.query.duration) || 60;     // Will be number for single session

    const bufferTime = 15;
    const { lat, lng } = req.query;

    console.log('DEBUG /available route received:', {
      date: req.params.date,
      isMultiSession,
      appointmentDuration,
      lat,
      lng
    });

    console.log('Processing availability request:', {
      appointmentDuration,
      isMultiSession,
      date: requestedDate
    });

    const availability = await Availability.findOne({ 
      date: { $gte: startOfDay, $lt: endOfDay },
      type: 'autobook'
    });

    console.log('Found availability:', availability);

    if (!availability) {
      return res.status(404).json({ message: 'No availability found for the requested date' });
    }

    const bookings = await Booking.find({
      date: { $gte: startOfDay, $lt: endOfDay }
    }).sort({ startTime: 1 });

    console.log('Found bookings:', bookings);

    const clientLocation = { lat: parseFloat(lat), lng: parseFloat(lng) };

    // Pass the duration(s) as the 4th parameter
    const availableSlots = await getAvailableTimeSlots(
      availability,
      bookings,
      clientLocation,
      appointmentDuration,  // This will be array for multi-session, number for single
      bufferTime
    );

    console.log('DEBUG: availableSlots returned from timeUtils:', availableSlots);

    console.log('Available slots:', availableSlots);

    res.json(availableSlots.map(slot => slot.toTimeString().slice(0, 5)));
  } catch (error) {
    console.error('Error in /available/:date route:', error);
    res.status(500).json({ message: 'Server error', error: error.message, stack: error.stack });
  }
});

// Utility function
const checkBookingConflicts = async (date, startTime, endTime, blockId = null) => {
  const query = {
    date,
    $or: [
      { startTime: { $lt: endTime, $gte: startTime } },
      { endTime: { $gt: startTime, $lte: endTime } }
    ]
  };
  
  const bookings = await Booking.find(query)
    .populate('client', 'email profile.fullName')
    .lean();
    
  return {
    hasConflicts: bookings.length > 0,
    bookings: bookings.map(booking => ({
      time: `${booking.startTime} - ${booking.endTime}`,
      client: booking.client.profile?.fullName || booking.client.email,
      id: booking._id
    }))
  };
};

module.exports = router;
