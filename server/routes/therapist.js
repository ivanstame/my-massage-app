const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const { ensureAuthenticated } = require('../middleware/passportMiddleware');

router.get('/status', ensureAuthenticated, async (req, res) => {
  try {
    const currentTime = new Date();
    const currentBooking = await Booking.findOne({
      date: { $lte: currentTime },
      endTime: { $gte: currentTime.toTimeString().slice(0, 5) },
      status: 'in-progress'
    });

    if (currentBooking) {
      res.json({
        status: 'busy',
        currentLocation: currentBooking.location,
        availableAt: new Date(currentBooking.date.getTime() + currentBooking.duration * 60000 + currentBooking.breakdownTime * 60000)
      });
    } else {
      res.json({ status: 'available', currentLocation: null });
    }
  } catch (error) {
    console.error('Error fetching therapist status:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;