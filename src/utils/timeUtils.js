// timeUtils.js

const { DateTime } = require('luxon');
const { calculateTravelTime } = require('../services/mapService'); // Adjust the path as necessary

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
    // Example: 15 minutes * groupSize + extraDepartureBuffer
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
    currentTime = ${String(endHours).padStart(2, '0')}:${String(endMinutes).padStart(2, '0')};
  }

  // If all sessions fit, return true
  return true;
};

//
// Generate time slots in half-hour increments
//
function generateTimeSlots(startTime, endTime, intervalMinutes, appointmentDuration) {
  const slots = [];
  let currentTime = new Date(startTime);

  // If appointmentDuration is an array, pick the longest session as a baseline
  const appointmentDurationMs = Array.isArray(appointmentDuration)
    ? Math.max(...appointmentDuration) * 60000
    : appointmentDuration * 60000;

  while (currentTime <= new Date(endTime.getTime() - appointmentDurationMs)) {
    slots.push(new Date(currentTime));
    currentTime.setMinutes(currentTime.getMinutes() + intervalMinutes);
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
    ? Math.max(...appointmentDuration) * 60000
    : appointmentDuration * 60000;

  return slots.filter(slot => {
    const slotStart = new Date(slot);
    const slotEnd = new Date(slotStart.getTime() + appointmentDurationMs);

    return !bookings.some(booking => {
      const bookingStart = new Date(${booking.date.toISOString().split('T')[0]}T${booking.startTime});
      const bookingEnd = new Date(${booking.date.toISOString().split('T')[0]}T${booking.endTime});

      // Calculate a dynamic buffer
      const buffer = calculateBufferBetweenBookings(
        { groupId: requestedGroupId, location: clientLocation },
        booking,
        bufferMinutes,
        bookings
      );

      const bufferTimeMs = buffer * 60000;
      const occupiedStart = new Date(bookingStart.getTime() - bufferTimeMs);
      const occupiedEnd = new Date(bookingEnd.getTime() + bufferTimeMs);

      return (slotStart < occupiedEnd && slotEnd > occupiedStart);
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
        DateTime.fromISO(${booking.date.toISOString().split('T')[0]}T${booking.endTime}) <= slotStart
      );
      const nextBooking = bookings.find(booking =>
        DateTime.fromISO(${booking.date.toISOString().split('T')[0]}T${booking.startTime}) > slotStart
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
          console.error([Single-Session] Error validating service area for slot: ${slotStart.toISO()}, error);
          isValid = false;
          continue;
        }
      }

      // Check arrival buffer from previous booking
      if (prevBooking && isValid) {
        const prevBookingEnd = DateTime.fromISO(
          ${prevBooking.date.toISOString().split('T')[0]}T${prevBooking.endTime}
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
          ${nextBooking.date.toISOString().split('T')[0]}T${nextBooking.startTime}
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
          console.error([Single-Session] Error calculating travel time for slot: ${slotStart.toISO()}, error);
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

  const startTime = new Date(${adminAvailability.date.toISOString().split('T')[0]}T${adminAvailability.start});
  const endTime = new Date(${adminAvailability.date.toISOString().split('T')[0]}T${adminAvailability.end});

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
  validateSlots
};

server/services/mapService.js:
const axios = require('axios');
const { User } = require('../models/User');

const TRAFFIC_THRESHOLD_KM = 40; // Adjust this value as needed

const isWithinServiceArea = (origin, destination, serviceArea) => {
  if (!serviceArea || !serviceArea.radius || !serviceArea.center) {
    return true; // No service area restrictions
  }

  // Calculate distance from service area center to destination
  const R = 6371; // Earth's radius in km
  const lat1 = serviceArea.center.lat * Math.PI / 180;
  const lat2 = destination.lat * Math.PI / 180;
  const dLat = (destination.lat - serviceArea.center.lat) * Math.PI / 180;
  const dLon = (destination.lng - serviceArea.center.lng) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
           Math.cos(lat1) * Math.cos(lat2) * 
           Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;

  return distance <= serviceArea.radius;
};

async function validateProviderTravel(origin, destination, providerId) {
  try {
    const provider = await User.findById(providerId);
    if (!provider || provider.accountType !== 'PROVIDER') {
      throw new Error('Invalid provider');
    }

    const serviceArea = provider.providerProfile?.serviceArea;
    if (!isWithinServiceArea(origin, destination, serviceArea)) {
      throw new Error('Location is outside provider service area');
    }

    return true;
  } catch (error) {
    console.error('Provider travel validation error:', error);
    throw error;
  }
}

async function calculateTravelTime(origin, destination, departureTime, providerId) {
  console.log('Calculating travel time:');
  console.log('Origin:', JSON.stringify(origin));
  console.log('Destination:', JSON.stringify(destination));
  console.log('Departure Time:', departureTime);

  try {
    if (!origin || !destination || !departureTime) {
      throw new Error('Missing required parameters for travel time calculation');
    }

    if (!origin.lat || !origin.lng || !destination.lat || !destination.lng) {
      throw new Error('Invalid location data for travel time calculation');
    }

    // Validate provider service area if providerId is provided
    if (providerId) {
      await validateProviderTravel(origin, destination, providerId);
    }

    const response = await axios.get('https://maps.googleapis.com/maps/api/distancematrix/json', {
      params: {
        origins: ${origin.lat},${origin.lng},
        destinations: ${destination.lat},${destination.lng},
        mode: 'driving',
        departure_time: Math.floor(departureTime.getTime() / 1000),
        key: process.env.GOOGLE_MAPS_API_KEY
      }
    });

    console.log('API Response:', JSON.stringify(response.data, null, 2));

    if (response.data.status === 'OK' && response.data.rows[0].elements[0].status === 'OK') {
      const distanceInMeters = response.data.rows[0].elements[0].distance.value;
      const distanceInKm = distanceInMeters / 1000;
      
      let durationInSeconds;
      if (distanceInKm > TRAFFIC_THRESHOLD_KM) {
        durationInSeconds = response.data.rows[0].elements[0].duration_in_traffic.value;
        console.log('Using traffic-aware duration for long distance');
      } else {
        durationInSeconds = response.data.rows[0].elements[0].duration.value;
        console.log('Using standard duration for short distance');
      }

      const durationInMinutes = Math.ceil(durationInSeconds / 60);
      console.log('Calculated duration:', durationInMinutes, 'minutes');
      console.log('Distance:', distanceInKm.toFixed(2), 'km');
      return durationInMinutes;
    } else {
      throw new Error(Unable to calculate travel time. API Status: ${response.data.status}, Element Status: ${response.data.rows[0].elements[0].status});
    }
  } catch (error) {
    console.error('Error calculating travel time:', error);
    throw error;
  }
}

module.exports = {
  calculateTravelTime,
  validateProviderTravel,
  isWithinServiceArea
};