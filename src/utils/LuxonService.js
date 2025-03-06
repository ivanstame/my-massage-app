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
  
  // Format ISO datetime string to display format
  static formatISOToDisplay(isoString, format = TIME_FORMATS.TIME_24H, timezone = DEFAULT_TZ) {
    try {
      // Parse ISO string to DateTime object
      const dt = DateTime.fromISO(isoString, { zone: 'utc' });
      
      // Validate the DateTime object
      if (!dt.isValid) {
        console.warn('Invalid ISO datetime:', isoString);
        return null;
      }
      
      // Convert to target timezone and format
      return dt.setZone(timezone).toFormat(format);
    } catch (error) {
      console.error('Error formatting ISO datetime:', error);
      return null;
    }
  }

  // Convert LA time string to UTC DateTime
  static convertToUTC(laTimeString, format = TIME_FORMATS.ISO_DATETIME) {
    return DateTime.fromFormat(laTimeString, format, { zone: DEFAULT_TZ }).toUTC();
  }

  // Generate time slots in LA time with proper DST handling
  static generateTimeSlots(start, end, intervalMinutes, appointmentDuration = 60) {
    let slots = [];
    
    // Handle both Date objects and ISO strings
    let current;
    let endDT;
    
    if (start instanceof Date) {
      current = DateTime.fromJSDate(start).setZone(DEFAULT_TZ);
      endDT = DateTime.fromJSDate(end).setZone(DEFAULT_TZ);
      console.log('Using Date objects:', {
        currentTime: current.toFormat('HH:mm'),
        endTime: endDT.toFormat('HH:mm')
      });
    } else {
      current = DateTime.fromISO(start, { zone: DEFAULT_TZ });
      endDT = DateTime.fromISO(end, { zone: DEFAULT_TZ });
      console.log('Using ISO strings:', {
        currentTime: current.toFormat('HH:mm'),
        endTime: endDT.toFormat('HH:mm')
      });
    }
    
    // Validate times
    if (!current.isValid || !endDT.isValid) {
      console.error('Invalid date/time objects:', { start, end });
      return [];
    }
    
    // Convert appointment duration to minutes if not already
    const durationMinutes = typeof appointmentDuration === 'number' && appointmentDuration > 0
      ? appointmentDuration
      : 60; // Default to 60 minutes
    
    console.log(`Generating slots from ${current.toFormat('HH:mm')} to ${endDT.toFormat('HH:mm')} with ${durationMinutes} min duration`);
    
    // Ensure we don't create slots that would exceed the end time
    while (current.plus({ minutes: durationMinutes }) <= endDT) {
      const slotEnd = current.plus({ minutes: durationMinutes });
      
      // Skip slots that would cross DST transitions
      if (!this.checkDSTTransition(current.toISO(), slotEnd.toISO())) {
        slots.push({
          start: current.toUTC().toISO(),
          end: slotEnd.toUTC().toISO(),
          localStart: current.toFormat(TIME_FORMATS.TIME_12H),
          localEnd: slotEnd.toFormat(TIME_FORMATS.TIME_12H)
        });
      }
      
      // Move to the next interval
      current = current.plus({ minutes: intervalMinutes });
    }
    
    console.log(`Generated ${slots.length} slots`);
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
      const startHour = currentSlot.hour + currentSlot.minute / 60;
      const endHour = sessionEnd.hour + sessionEnd.minute / 60;

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

  // Remove occupied slots
  static removeOccupiedSlots(slots, bookings, clientLocation, appointmentDuration, bufferTime) {
    if (!Array.isArray(slots) || slots.length === 0) {
      console.log('No slots to filter - returning empty array');
      return [];
    }
    
    // Ensure appointmentDuration is a valid number
    const duration = typeof appointmentDuration === 'number' && appointmentDuration > 0
      ? appointmentDuration
      : 60; // Default to 60 minutes if invalid
      
    // Ensure bufferTime is a valid number
    const buffer = typeof bufferTime === 'number' && bufferTime > 0
      ? bufferTime
      : 15; // Default to 15 minute buffer if invalid
    
    const availableSlots = [];
    
    slots.forEach(slot => {
      try {
        // Convert slot start from UTC to LA time
        const slotStartLA = DateTime.fromISO(slot.start, { zone: 'utc' }).setZone(DEFAULT_TZ);
        const slotEndLA = slotStartLA.plus({ minutes: duration });
        
        // Skip this slot if it spans a DST transition
        if (this.checkDSTTransition(slotStartLA.toISO(), slotEndLA.toISO())) {
          console.log(`Skipping slot at ${slotStartLA.toFormat(TIME_FORMATS.TIME_24H)} - spans DST transition`);
          return;
        }

        // Check against existing bookings
        let conflict = false;
        
        if (Array.isArray(bookings) && bookings.length > 0) {
          conflict = bookings.some(booking => {
            try {
              // Handle different booking time formats
              const bookingStartLA = booking.startTime instanceof Date
                ? DateTime.fromJSDate(booking.startTime).setZone(DEFAULT_TZ)
                : DateTime.fromFormat(`${booking.date.toISOString().split('T')[0]} ${booking.startTime}`, 'yyyy-MM-dd HH:mm', { zone: DEFAULT_TZ });
                
              const bookingEndLA = booking.endTime instanceof Date
                ? DateTime.fromJSDate(booking.endTime).setZone(DEFAULT_TZ)
                : DateTime.fromFormat(`${booking.date.toISOString().split('T')[0]} ${booking.endTime}`, 'yyyy-MM-dd HH:mm', { zone: DEFAULT_TZ });
                
              const adjustedBookingStart = bookingStartLA.minus({ minutes: buffer });
              const adjustedBookingEnd = bookingEndLA.plus({ minutes: buffer });
              
              return slotStartLA < adjustedBookingEnd && slotEndLA > adjustedBookingStart;
            } catch (err) {
              console.error('Error checking booking conflict:', err);
              return true; // Assume conflict on error to be safe
            }
          });
        }

        if (!conflict) {
          availableSlots.push(slot);
        }
      } catch (err) {
        console.error('Error processing slot:', err);
        // Skip this slot on error
      }
    });
    
    return availableSlots;
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
