// timeUtils.js

const { DateTime } = require('luxon');
const { calculateTravelTime } = require('../services/mapService'); // Adjust the path as necessary
const { DEFAULT_TZ } = require('../../src/utils/timeConstants');
const { TIME_FORMATS } = require('../../src/utils/timeConstants');
const { validateProviderTravel } = require('../services/mapService');

const laZone = 'America/Los_Angeles';

//
// HELPER FUNCTION: Calculate buffer based on group ID and location
//
const calculateBufferBetweenBookings = (booking1, booking2, defaultBuffer = 15, allBookings = []) => {
  // If we don't have two real bookings, just return the default buffer
  if (!booking1 || !booking2) {
    return defaultBuffer;
  }

  // If both bookings share the same groupId and location, skip the in-between buffer
  if (
    booking1.groupId &&
    booking2.groupId &&
    booking1.groupId === booking2.groupId &&
    booking1.location?.address === booking2.location?.address
  ) {
    return 0;
  }

  // If the first booking is flagged as "last in group," add the accumulated buffer
  if (booking1.groupId && booking1.isLastInGroup && booking1.extraDepartureBuffer) {
    // Count how many bookings share that groupId
    const groupSize = allBookings.filter(b => b.groupId === booking1.groupId).length;
    // Add extra buffer based on group size
    return defaultBuffer * groupSize + booking1.extraDepartureBuffer;
  }

  // Otherwise, return the default buffer
  return defaultBuffer;
};

//
// HELPER FUNCTION: Validate a chain of sessions (multi-session wizard scenario)
//
const validateMultiSessionSlot = async (
  startTimeString,      // e.g. "13:00"
  sessionDurations,     // array of durations [90, 60, 120, ...]
  bookings,
  clientLocation,
  earliestTime,         // e.g. 6 (6 AM)
  latestTime            // e.g. 22 (10 PM)
) => {
  console.log('DEBUG: validateMultiSessionSlot checking chain:', { 
    startTimeString, 
    sessionDurations 
  });

  let currentTime = startTimeString;

  for (let i = 0; i < sessionDurations.length; i++) {
    const duration = sessionDurations[i];
    const [hours, minutes] = currentTime.split(':').map(Number);

    // Check if we're still within business hours
    if (hours < earliestTime || hours >= latestTime) {
      return false;
    }

    // Ensure we're on a half-hour boundary
    if (minutes % 30 !== 0) {
      return false;
    }

    // Calculate end time for this session
    const totalMinutes = hours * 60 + minutes + duration;
    const endHours = Math.floor(totalMinutes / 60);
    const endMinutes = totalMinutes % 60;

    // Check if end time is within business hours
    if (endHours >= latestTime) {
      return false;
    }

    // If this is the last session, see if we can fit the combined buffer
    if (i === sessionDurations.length - 1) {
      // Calculate the buffer based on number of sessions
      const bufferMinutes = 15 * (sessionDurations.length - 1);
      const withBufferMinutes = totalMinutes + bufferMinutes;
      const bufferEndHour = Math.floor(withBufferMinutes / 60);
      if (bufferEndHour >= latestTime) {
        return false;
      }
    }

    // Move currentTime to the end of this session (no middle buffer)
    currentTime = `${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')}`;
  }

  // If all sessions fit, return true
  return true;
};

//
// Generate time slots in half-hour increments
//
function generateTimeSlots(startTime, endTime, intervalMinutes, appointmentDuration) {
  // Convert to LA timezone for calculations
  const startDT = DateTime.fromISO(startTime, { zone: DEFAULT_TZ });
  const endDT = DateTime.fromISO(endTime, { zone: DEFAULT_TZ });
  const slots = [];
  let currentSlot = startDT;

  // If appointmentDuration is an array (multi-session), use the longest duration
  const maxDuration = Array.isArray(appointmentDuration) 
    ? Math.max(...appointmentDuration) 
    : appointmentDuration;

  while (currentSlot <= endDT.minus({ minutes: maxDuration })) {
    // Skip slots that would create appointments spanning DST transitions
    const slotEnd = currentSlot.plus({ minutes: maxDuration });
    if (!LuxonService.checkDSTTransition(
      currentSlot.toISO(), 
      slotEnd.toISO()
    )) {
      slots.push({
        start: currentSlot.toUTC().toISO(),
        end: slotEnd.toUTC().toISO(),
        localStart: currentSlot.toFormat(TIME_FORMATS.TIME_12H),
        localEnd: slotEnd.toFormat(TIME_FORMATS.TIME_12H)
      });
    }

    currentSlot = currentSlot.plus({ minutes: intervalMinutes });
  }

  return slots;
}

//
// Remove occupied slots (considering buffer on both ends)
//
function removeOccupiedSlots(
  slots, 
  bookings, 
  appointmentDuration, 
  bufferMinutes, 
  requestedGroupId = null,
  clientLocation = null
) {
  // If appointmentDuration is an array, use the longest duration as a baseline
  const appointmentDurationMs = Array.isArray(appointmentDuration)
    ? Math.max(...appointmentDuration) * 60 * 1000
    : appointmentDuration * 60 * 1000;

  return slots.filter(slot => {
    // Convert slot to Luxon DateTime in LA timezone
    const slotStart = DateTime.fromJSDate(slot).setZone(DEFAULT_TZ);
    const slotEnd = slotStart.plus({ milliseconds: appointmentDurationMs });

    return !bookings.some(booking => {
      // Convert booking times to Luxon DateTime in LA timezone
      const bookingStart = DateTime.fromFormat(
        `${booking.date.toISOString().split('T')[0]} ${booking.startTime}`,
        'yyyy-MM-dd HH:mm',
        { zone: DEFAULT_TZ }
      );
      const bookingEnd = DateTime.fromFormat(
        `${booking.date.toISOString().split('T')[0]} ${booking.endTime}`,
        'yyyy-MM-dd HH:mm',
        { zone: DEFAULT_TZ }
      );

      // Calculate dynamic buffer based on booking context
      const buffer = calculateBufferBetweenBookings(
        { groupId: requestedGroupId, location: clientLocation },
        booking,
        bufferMinutes,
        bookings
      );

      const bufferMs = buffer * 60 * 1000;
      const occupiedStart = bookingStart.minus({ milliseconds: bufferMs });
      const occupiedEnd = bookingEnd.plus({ milliseconds: bufferMs });

      // Check if slot overlaps with occupied time (including buffer)
      return slotStart < occupiedEnd && slotEnd > occupiedStart;
    });
  });
}

//
// Validate slots for final availability check
//
async function validateSlots(
  slots,
  bookings,
  clientLocation,
  appointmentDuration,
  bufferMinutes,
  adminEndTime,
  requestedGroupId = null,
  extraDepartureBuffer = 0,
  providerId = null
) {
  const validSlots = [];

  for (const slot of slots) {
    let isValid = true;
    const slotStart = DateTime.fromJSDate(slot);
    
    console.log('Validating slot:', {
      localTime: DateTime.fromJSDate(slot).setZone('America/Los_Angeles').toString(),
      utcTime: slot.toISOString(),
      bookingStart: DateTime.fromJSDate(slot).setZone('America/Los_Angeles').toString(),
      utcBookingStart: slot.toISOString()
    });

    // Branch for multi-session arrays
    if (Array.isArray(appointmentDuration)) {
      const canFitChain = await validateMultiSessionSlot(
        slotStart.toFormat('HH:mm'),
        appointmentDuration,
        bookings,
        clientLocation,
        6,   // earliest hour
        22   // latest hour
      );
      if (!canFitChain) isValid = false;
    } 
    // Single-session branch
    else {
      const slotEnd = slotStart.plus({ minutes: appointmentDuration });
      const reversedBookings = [...bookings].reverse();
      const prevBooking = reversedBookings.find(booking =>
        DateTime.fromISO(`${booking.date.toISOString().split('T')[0]}T${booking.endTime}`) <= slotStart
      );
      const nextBooking = bookings.find(booking =>
        DateTime.fromISO(`${booking.date.toISOString().split('T')[0]}T${booking.startTime}`) > slotStart
      );

      // Check service area if provider specified
      if (providerId && isValid) {
        try {
          // Validate travel from previous booking
          if (prevBooking) {
            const travelValid = await validateProviderTravel(
              prevBooking.location,
              clientLocation,
              providerId
            );
            if (!travelValid) {
              console.log('[Single-Session] Slot invalid: outside provider service area from previous booking');
              isValid = false;
              continue;
            }
          }

          // Validate travel to next booking
          if (nextBooking) {
            const travelValid = await validateProviderTravel(
              clientLocation,
              nextBooking.location,
              providerId
            );
            if (!travelValid) {
              console.log('[Single-Session] Slot invalid: outside provider service area to next booking');
              isValid = false;
              continue;
            }
          }
        } catch (error) {
          console.error(`[Single-Session] Error validating service area for slot: ${slotStart.toISO()}`, error);
          isValid = false;
          continue;
        }
      }

      // Check arrival buffer from previous booking
      if (prevBooking && isValid) {
        const prevBookingEnd = DateTime.fromISO(
          `${prevBooking.date.toISOString().split('T')[0]}T${prevBooking.endTime}`
        );
        const travelTimeFromPrev = await calculateTravelTime(
          prevBooking.location,
          clientLocation,
          prevBookingEnd.plus({ minutes: bufferMinutes }).toJSDate()
        );

        const requiredArrivalTime = slotStart.minus({ minutes: 15 });
        const actualArrivalTime = prevBookingEnd.plus({
          minutes: bufferMinutes + travelTimeFromPrev
        });

        if (actualArrivalTime > requiredArrivalTime) {
          console.log('[Single-Session] Slot invalid: not enough time to arrive 15 mins before start');
          isValid = false;
        }
      }

      // Check departure buffer to next booking
      if (nextBooking && isValid) {
        const dynamicBuffer = calculateBufferBetweenBookings(
          { groupId: requestedGroupId, location: clientLocation },
          nextBooking,
          bufferMinutes,
          bookings
        );
        const slotEndWithBuffer = slotEnd.plus({ minutes: dynamicBuffer });
        const nextBookingStart = DateTime.fromISO(
          `${nextBooking.date.toISOString().split('T')[0]}T${nextBooking.startTime}`
        );
        const requiredDepartureTime = nextBookingStart.minus({ minutes: 15 });

        try {
          const travelTimeToNext = await calculateTravelTime(
            clientLocation,
            nextBooking.location,
            slotEndWithBuffer.toJSDate()
          );
          const actualDepartureTime = slotEndWithBuffer.plus({ minutes: travelTimeToNext });
          if (actualDepartureTime > requiredDepartureTime) {
            console.log('[Single-Session] Slot invalid: not enough time to reach next booking 15 mins before');
            isValid = false;
          }
        } catch (error) {
          console.error(`[Single-Session] Error calculating travel time for slot: ${slotStart.toISO()}`, error);
          isValid = false;
        }
      }
    }

    if (isValid) {
      console.log('Slot is valid:', slotStart.toISO());
      validSlots.push(slot);
    }
  }

  return validSlots;
}

//
// The main function to retrieve open slots
//
async function getAvailableTimeSlots(
  adminAvailability,
  bookings,
  clientLocation,
  appointmentDuration,
  bufferMinutes,
  requestedGroupId = null,
  extraDepartureBuffer = 0,
  providerId = null
) {
  console.log('DEBUG: getAvailableTimeSlots invoked with:', {
    adminAvailability,
    appointmentDuration,
    bufferMinutes,
    requestedGroupId,
    extraDepartureBuffer
  });
  console.log('DEBUG: is Array?', Array.isArray(appointmentDuration));

  const availabilityDateLA = DateTime.fromJSDate(adminAvailability.date)
    .setZone('America/Los_Angeles')
    .startOf('day');
    
  const datePart = availabilityDateLA.toFormat('yyyy-MM-dd');

  const startTime = DateTime.fromISO(`${datePart}T${adminAvailability.start}`, { 
    zone: 'America/Los_Angeles' 
  }).toUTC().toJSDate();

  const endTime = DateTime.fromISO(`${datePart}T${adminAvailability.end}`, { 
    zone: 'America/Los_Angeles' 
  }).toUTC().toJSDate();

  const slots = generateTimeSlots(startTime, endTime, 30, appointmentDuration);
  console.log('DEBUG: generated base slots:', slots.map(s => s.toTimeString().slice(0,5)));

  const slotsAfterOccupied = removeOccupiedSlots(
    slots,
    bookings,
    appointmentDuration,
    bufferMinutes,
    requestedGroupId,
    clientLocation
  );
  console.log('DEBUG: slotsAfterOccupied:', slotsAfterOccupied.map(s => s.toTimeString().slice(0,5)));

  const validSlots = await validateSlots(
    slotsAfterOccupied,
    bookings,
    clientLocation,
    appointmentDuration,
    bufferMinutes,
    endTime,
    requestedGroupId,
    extraDepartureBuffer,
    providerId
  );

  console.log('DEBUG: validSlots after travel time check:', validSlots.map(s => s.toTimeString().slice(0,5)));

  return validSlots;
}

module.exports = {
  getAvailableTimeSlots,
  generateTimeSlots,
  removeOccupiedSlots,
  validateSlots,
  calculateBufferBetweenBookings
};
