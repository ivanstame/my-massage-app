// middleware/validation.js
const { DateTime } = require('luxon');
const { DEFAULT_TZ, TIME_FORMATS } = require('../../shared/utils/timeConstants');
const LuxonService = require('../../shared/utils/LuxonService');

const validateTimeFormat = (timeStr) => {
  return /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/.test(timeStr);
};

const validateBookingInput = (req, res, next) => {
  try {
    const { date, time, duration, location } = req.body;
    const errors = [];

    // Validate date format
    const bookingDate = DateTime.fromISO(date, { zone: DEFAULT_TZ });
    if (!bookingDate.isValid) {
      errors.push('Invalid date format. Use YYYY-MM-DD');
    }

    // Validate time format
    if (!validateTimeFormat(time)) {
      errors.push('Invalid time format. Use HH:MM (24-hour format)');
    }

    // Validate duration
    if (!duration || duration < 30 || duration > 180) {
      errors.push('Duration must be between 30 and 180 minutes');
    }

    // For multi-session bookings
    if (req.body.groupId) {
      const { sessionDurations } = req.body;
      if (!Array.isArray(sessionDurations) || sessionDurations.length === 0) {
        errors.push('Session durations must be provided for multi-session booking');
      } else {
        // Validate each session duration
        sessionDurations.forEach((dur, index) => {
          if (!dur || dur < 30 || dur > 180) {
            errors.push(`Invalid duration for session ${index + 1}`);
          }
        });

        // Check for DST transitions in multi-session blocks
        const startDT = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm', { zone: DEFAULT_TZ });
        const totalDuration = sessionDurations.reduce((sum, dur) => sum + dur, 0);
        const endDT = startDT.plus({ minutes: totalDuration });

        if (LuxonService.checkDSTTransition(startDT.toISO(), endDT.toISO())) {
          errors.push('Multi-session booking cannot span DST transition');
        }
      }
    }

    // Validate location
    if (!location || !location.lat || !location.lng || !location.address) {
      errors.push('Complete location information is required');
    } else {
      if (location.lat < -90 || location.lat > 90) {
        errors.push('Invalid latitude');
      }
      if (location.lng < -180 || location.lng > 180) {
        errors.push('Invalid longitude');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors
      });
    }

    // Add validated and parsed date/time to request
    req.bookingDateTime = DateTime.fromFormat(`${date} ${time}`, 'yyyy-MM-dd HH:mm', { zone: DEFAULT_TZ });
    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(400).json({
      success: false,
      errors: ['Invalid booking data']
    });
  }
};

const validateAvailabilityInput = (req, res, next) => {
  try {
    const { date, start, end, type } = req.body;
    const errors = [];

    // Validate date format
    const availabilityDate = DateTime.fromISO(date, { zone: DEFAULT_TZ });
    if (!availabilityDate.isValid) {
      errors.push('Invalid date format. Use YYYY-MM-DD');
    }

    // Validate time formats
    if (!validateTimeFormat(start)) {
      errors.push('Invalid start time format. Use HH:MM');
    }
    if (!validateTimeFormat(end)) {
      errors.push('Invalid end time format. Use HH:MM');
    }

    // Validate type
    if (!['autobook', 'unavailable'].includes(type)) {
      errors.push('Invalid availability type');
    }

    // Validate times are in the same day
    if (start && end) {
      const startDT = DateTime.fromFormat(`${date} ${start}`, 'yyyy-MM-dd HH:mm', { zone: DEFAULT_TZ });
      const endDT = DateTime.fromFormat(`${date} ${end}`, 'yyyy-MM-dd HH:mm', { zone: DEFAULT_TZ });

      if (!startDT.hasSame(endDT, 'day')) {
        errors.push('Start and end times must be within the same day');
      }

      if (endDT <= startDT) {
        errors.push('End time must be after start time');
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors: errors
      });
    }

    // Add validated date to request
    req.availabilityDate = availabilityDate;
    next();
  } catch (error) {
    console.error('Validation error:', error);
    res.status(400).json({
      success: false,
      errors: ['Invalid availability data']
    });
  }
};

module.exports = {
  validateBookingInput,
  validateAvailabilityInput
};