import { DateTime, Settings } from 'luxon';
import { DEFAULT_TZ, UTC_TZ, TIME_FORMATS } from './timeConstants';

class LuxonService {
  // Set default timezone for all Luxon operations
  static init() {
    Settings.defaultZone = DEFAULT_TZ;
  }

  // Convert JS Date to LA time DateTime
  static convertToLA(date, format = TIME_FORMATS.ISO_DATETIME) {
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

export default LuxonService;
