// shared/utils/LuxonService.js
const { DateTime, Settings } = require('luxon');
const { DEFAULT_TZ, UTC_TZ, TIME_FORMATS } = require('./timeConstants');

// Set default timezone for all Luxon operations
Settings.defaultZone = DEFAULT_TZ;

class LuxonService {
  // Convert JS Date to LA time DateTime
  static convertToLA(date) {
    return DateTime.fromJSDate(date).setZone(DEFAULT_TZ);
  }

  // Convert LA time string to UTC DateTime
  static convertToUTC(laTimeString, format = TIME_FORMATS.ISO_DATETIME) {
    return DateTime.fromFormat(laTimeString, format, { zone: DEFAULT_TZ }).toUTC();
  }

  // Generate time slots in LA time with proper DST handling
  static generateTimeSlots(start, end, intervalMinutes) {
    let slots = [];
    let current = DateTime.fromISO(start, { zone: DEFAULT_TZ });
    const endDT = DateTime.fromISO(end, { zone: DEFAULT_TZ });

    while (current < endDT) {
      const slotEnd = current.plus({ minutes: intervalMinutes });
      slots.push({
        start: current.toUTC().toISO(),
        end: slotEnd.toUTC().toISO(),
        localStart: current.toFormat(TIME_FORMATS.TIME_12H),
        localEnd: slotEnd.toFormat(TIME_FORMATS.TIME_12H)
      });
      current = slotEnd;
    }

    return slots;
  }

  // Generate and validate multi-session slots
  static generateMultiSessionSlots(
    startTimeLA,       // DateTime in LA time
    sessionDurations,  // array of minutes [90, 60, ...]
    bufferMinutes,     // between sessions
    workDayStart,      // number (6 = 6 AM)
    workDayEnd         // number (22 = 10 PM)
  ) {
    // Convert all times to LA zone for calculations
    let currentSlot = startTimeLA.setZone(DEFAULT_TZ);
    const slots = [];
    let isValid = true;

    // Check each session fits in the work day
    for (const [index, duration] of sessionDurations.entries()) {
      const sessionEnd = currentSlot.plus({ minutes: duration });

      // Check work hours in LA time
      const startHour = currentSlot.hour + currentSlot.minute/60;
      const endHour = sessionEnd.hour + sessionEnd.minute/60;

      if (startHour < workDayStart || endHour > workDayEnd) {
        isValid = false;
        break;
      }

      // Check DST consistency
      if (currentSlot.isInDST !== sessionEnd.isInDST) {
        isValid = false;
        break;
      }

      slots.push({
        sessionNumber: index + 1,
        localStart: currentSlot.toFormat(TIME_FORMATS.TIME_12H),
        localEnd: sessionEnd.toFormat(TIME_FORMATS.TIME_12H),
        utcStart: currentSlot.toUTC().toISO(),
        utcEnd: sessionEnd.toUTC().toISO(),
        durationMinutes: duration
      });

      // Add buffer between sessions
      currentSlot = sessionEnd.plus({ minutes: bufferMinutes });
    }

    return {
      isValid,
      slots: isValid ? slots : [],
      validationErrors: isValid ? [] : [
        'SLOT_INVALID_REASON_DST_TRANSITION',
        'SLOT_INVALID_REASON_OUTSIDE_WORK_HOURS'
      ]
    };
  }

  // Validate date range stays within same day in LA time
  static validateSameDay(startUTC, endUTC) {
    const startLA = DateTime.fromISO(startUTC).setZone(DEFAULT_TZ);
    const endLA = DateTime.fromISO(endUTC).setZone(DEFAULT_TZ);
    return startLA.hasSame(endLA, 'day');
  }

  // Check if a date range crosses DST transition
  static checkDSTTransition(startUTC, endUTC) {
    const startLA = DateTime.fromISO(startUTC).setZone(DEFAULT_TZ);
    const endLA = DateTime.fromISO(endUTC).setZone(DEFAULT_TZ);
    return startLA.isInDST !== endLA.isInDST;
  }
}

module.exports = LuxonService;