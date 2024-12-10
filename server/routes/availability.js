const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/passportMiddleware');
const { getAvailableTimeSlots } = require('../utils/timeUtils');

// Get availability blocks for a specific date
router.get('/blocks/:date', ensureAuthenticated, async (req, res) => {
  try {
    const date = new Date(req.params.date);
    const nextDay = new Date(date);
    nextDay.setDate(nextDay.getDate() + 1);

    const availabilityBlocks = await Availability.find({
      date: {
        $gte: date,
        $lt: nextDay
      }
    }).sort({ start: 1 });

    res.json(availabilityBlocks);
  } catch (error) {
    console.error('Error fetching availability blocks:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new availability (admin only)
router.post('/', ensureAdmin, async (req, res) => {
  try {
    const { date, start, end, type } = req.body;
    const availability = new Availability({
      date: new Date(date),
      start,
      end,
      type
    });

    const newAvailability = await availability.save();
    res.status(201).json(newAvailability);
  } catch (error) {
    console.error('Error creating availability:', error);
    res.status(400).json({ message: error.message });
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

// Delete availability (admin only)
router.delete('/:id', ensureAdmin, async (req, res) => {
  try {
    const block = await Availability.findById(req.params.id);
    if (!block) {
      return res.status(404).json({ message: 'Availability block not found' });
    }

    const { hasConflicts, bookings } = await checkBookingConflicts(
      block.date,
      block.start,
      block.end
    );

    if (hasConflicts) {
      return res.status(400).json({
        message: 'Cannot delete: Block contains existing appointments',
        conflicts: bookings
      });
    }

    await block.remove();
    res.json({ message: 'Availability block deleted successfully' });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ message: error.message });
  }
});

// Get available slots for a specific date
router.get('/available/:date', async (req, res) => {
  try {
    const requestedDate = new Date(req.params.date);
    const startOfDay = new Date(requestedDate.setHours(0, 0, 0, 0));
    const endOfDay = new Date(requestedDate.setHours(23, 59, 59, 999));

    console.log('Searching for availability between:', startOfDay, 'and', endOfDay);

    const duration = parseInt(req.query.duration) || 60;
    const bufferTime = 15;
    const { lat, lng } = req.query;

    console.log('Request parameters:', { duration, lat, lng });

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

    const availableSlots = await getAvailableTimeSlots(
      availability,
      bookings,
      clientLocation,
      duration,
      bufferTime
    );

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