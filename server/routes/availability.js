// routes/availability.js
// const express = require('express');
// const router = express.Router();
// const Availability = require('../models/Availability');
// const Booking = require('../models/Booking');
// const { ensureAuthenticated } = require('../middleware/passportMiddleware');
// const { validateAvailabilityInput } = require('../middleware/validation');
// const { DateTime } = require('luxon');
// const { DEFAULT_TZ, TIME_FORMATS } = require('../utils/timeConstants');
// const LuxonService = require('../utils/LuxonService');
const express = require('express');
const router = express.Router();
const Availability = require('../models/Availability');
const Booking = require('../models/Booking');
const { ensureAuthenticated } = require('../middleware/passportMiddleware');
const { validateAvailabilityInput } = require('../middleware/validation');
const { DateTime } = require('luxon');
const { DEFAULT_TZ, TIME_FORMATS } = require('../../shared/utils/timeConstants');
const LuxonService = require('../../shared/utils/LuxonService');

// Get availability blocks for a specific date
router.get('/blocks/:date', ensureAuthenticated, async (req, res) => {
  try {
    const providerId = req.user._id;
    const laDate = DateTime.fromISO(req.params.date, { zone: DEFAULT_TZ });

    const blocks = await Availability.find({
      provider: providerId,
      localDate: laDate.toFormat(TIME_FORMATS.ISO_DATE)
    });

    res.json(blocks);
  } catch (error) {
    console.error('Error fetching availability:', error);
    res.status(500).json({ message: 'Error fetching availability' });
  }
});

// Get availability block spans for a month
router.get('/month/:year/:month', ensureAuthenticated, async (req, res) => {
  try {
    const { year, month } = req.params;
    const startDate = DateTime.fromObject(
      { year: parseInt(year), month: parseInt(month), day: 1 },
      { zone: DEFAULT_TZ }
    );
    const endDate = startDate.endOf('month');

    const availabilityBlocks = await Availability.find({
      date: {
        $gte: startDate.toUTC().toJSDate(),
        $lte: endDate.toUTC().toJSDate()
      },
      type: 'autobook'
    }).sort({ date: 1 });

    res.json(availabilityBlocks);
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// Get available slots for a specific date
router.get('/available/:date', validateAvailabilityInput, async (req, res) => {
  try {
    // Date is already validated and parsed to LA timezone by middleware
    const laDate = req.availabilityDate;
    
    // Get start and end of day in LA time
    const startOfDay = laDate.startOf('day');
    const endOfDay = laDate.endOf('day');

    console.log('Searching for availability between:', 
      startOfDay.toFormat(TIME_FORMATS.ISO_DATETIME),
      'and',
      endOfDay.toFormat(TIME_FORMATS.ISO_DATETIME)
    );

    // Parse duration(s) from request and validate
    const isMultiSession = req.query.sessionDurations ? true : false;
    let appointmentDuration;
    
    if (isMultiSession) {
      appointmentDuration = JSON.parse(req.query.sessionDurations);
      if (!Array.isArray(appointmentDuration) || 
          !appointmentDuration.every(d => d >= 30 && d <= 180)) {
        return res.status(400).json({ 
          message: 'Invalid session durations. Each must be between 30 and 180 minutes.' 
        });
      }
    } else {
      appointmentDuration = parseInt(req.query.duration) || 60;
      if (appointmentDuration < 30 || appointmentDuration > 180) {
        return res.status(400).json({ 
          message: 'Duration must be between 30 and 180 minutes' 
        });
      }
    }

    const bufferTime = 15;
    const { lat, lng } = req.query;

    console.log('Processing availability request:', {
      appointmentDuration,
      isMultiSession,
      date: laDate.toFormat(TIME_FORMATS.ISO_DATE)
    });

    // Find availability block for the day
    const availability = await Availability.findOne({ 
      date: {
        $gte: startOfDay.toUTC().toJSDate(),
        $lt: endOfDay.toUTC().toJSDate()
      },
      type: 'autobook'
    });

    if (!availability) {
      return res.status(404).json({ 
        message: 'No availability found for the requested date' 
      });
    }

    // Get existing bookings for the day
    const bookings = await Booking.find({
      date: {
        $gte: startOfDay.toUTC().toJSDate(),
        $lt: endOfDay.toUTC().toJSDate()
      }
    }).sort({ startTime: 1 });

    console.log('Found bookings:', 
      bookings.map(b => `${b.startTime}-${b.endTime}`)
    );

    const clientLocation = { 
      lat: parseFloat(lat), 
      lng: parseFloat(lng) 
    };

    // Generate available slots
    const slots = LuxonService.generateTimeSlots(
      availability.start,
      availability.end,
      30,  // 30-minute intervals
      appointmentDuration
    );

    // Remove occupied slots
    const availableSlots = await LuxonService.removeOccupiedSlots(
      slots,
      bookings,
      clientLocation,
      appointmentDuration,
      bufferTime
    );

    console.log('Available slots:', 
      availableSlots.map(slot => slot.localStart)
    );

    res.json(availableSlots.map(slot => slot.localStart));
  } catch (error) {
    console.error('Error in /available/:date route:', error);
    res.status(500).json({ 
      message: 'Server error', 
      error: error.message
    });
  }
});

// Create new availability
router.post('/', ensureAuthenticated, validateAvailabilityInput, async (req, res) => {
  try {
    if (req.user.accountType !== 'PROVIDER') {
      return res.status(403).json({ 
        message: 'Only providers can set availability' 
      });
    }

    const newAvailability = new Availability({
      ...req.body,
      provider: req.user._id
    });

    await newAvailability.save();
    res.status(201).json(newAvailability);
  } catch (error) {
    console.error('Error creating availability:', error);
    res.status(500).json({ message: 'Availability creation failed' });
  }
});

// Delete availability block
router.delete('/:id', ensureAuthenticated, async (req, res) => {
  try {
    const availability = await Availability.findById(req.params.id);

    if (!availability) {
      return res.status(404).json({ message: 'Availability not found' });
    }

    // Verify ownership using provider reference
    if (!availability.provider.equals(req.user._id)) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    await availability.remove();
    res.json({ message: 'Availability removed' });
  } catch (error) {
    console.error('Error deleting availability:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;