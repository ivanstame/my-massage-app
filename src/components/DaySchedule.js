import React from 'react';
import { useNavigate } from 'react-router-dom';
import { DateTime } from 'luxon';
import { DEFAULT_TZ, TIME_FORMATS } from '../utils/timeConstants';

const DaySchedule = ({ date, availabilityBlocks, bookings, onModify, serviceArea }) => {
  const navigate = useNavigate();
  const startHour = 7;
  const endHour = 23;
  const totalHours = endHour - startHour + 1;

  const handleAppointmentClick = (bookingId) => {
    navigate(`/appointments/${bookingId}`);
  };

  const timeToPixels = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return ((hours - startHour) * 60 + minutes) * 2;
  };

  const formatTime = (timeStr) => {
    // Create a DateTime object at current date with given time in LA timezone
    const [hours, minutes] = timeStr.split(':').map(Number);
    return DateTime.now()
      .setZone(DEFAULT_TZ)
      .set({ hour: hours, minute: minutes })
      .toFormat('h:mm a');
  };

  // Hour marker component
  const HourMarker = ({ hour }) => {
    const displayTime = DateTime.now()
      .setZone(DEFAULT_TZ)
      .set({ hour })
      .toFormat('h:mm a');

    return (
      <div 
        className="absolute left-0 -translate-y-3 w-16 text-right pr-4 text-sm font-medium text-slate-500"
        style={{ top: `${(hour - startHour) * 60 * 2}px` }}
      >
        {displayTime}
      </div>
    );
  };

  // Half-hour marker component
  const HalfHourMarker = ({ hour }) => (
    <div 
      className="absolute left-0 right-0 border-t border-slate-100"
      style={{ top: `${((hour - startHour) * 60 + 30) * 2}px` }}
    />
  );

  // Hour grid line component
  const HourGridLine = ({ hour }) => (
    <div 
      className="absolute left-0 right-0 border-t border-slate-200"
      style={{ top: `${(hour - startHour) * 60 * 2}px` }}
    />
  );

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      {/* Schedule header */}
      <div className="bg-slate-700 py-1.5 px-3">  
        <h2 className="text-white text-sm">                  
          {DateTime.fromJSDate(date)
            .setZone(DEFAULT_TZ)
            .toFormat('cccc, LLLL d')}
        </h2>
      </div>

      {/* Schedule grid */}
      <div className="relative h-[1920px] mx-4 mt-4">
        {/* Time markers and grid lines */}
        <div className="absolute top-0 left-0 w-full h-full">
          {Array.from({ length: totalHours + 1 }).map((_, i) => (
            <React.Fragment key={i}>
              <HourMarker hour={startHour + i} />
              <HourGridLine hour={startHour + i} />
              <HalfHourMarker hour={startHour + i} />
            </React.Fragment>
          ))}
        </div>

        {/* Content area */}
        <div className="absolute left-16 right-0 top-0 bottom-0">
          {/* Availability blocks */}
          {availabilityBlocks.map((block, index) => {
            // Convert block times to LA timezone for display
            const blockStart = timeToPixels(block.start);
            const blockEnd = timeToPixels(block.end);

            return (
              <div
                key={`availability-${index}`}
                className={`absolute left-0 right-0 
                  ${block.type === 'autobook' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'} 
                  border rounded-md transition-all duration-200 hover:shadow-md`}
                style={{
                  top: `${blockStart}px`,
                  height: `${blockEnd - blockStart}px`,
                }}
              >
                <div className="p-2 flex flex-col h-full justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-sm font-medium text-slate-700">
                      {`${formatTime(block.start)} - ${formatTime(block.end)}`}
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-full 
                      ${block.type === 'autobook' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {block.type}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Bookings */}
          {bookings.map((booking, index) => {
            const bookingStart = timeToPixels(booking.startTime);
            const bookingEnd = timeToPixels(booking.endTime);
            
            return (
              <div
                key={`booking-${index}`}
                onClick={() => handleAppointmentClick(booking._id)}
                className="absolute left-1 right-1 bg-blue-50 border border-blue-200 
                  rounded-md shadow-sm cursor-pointer transition-all duration-200 
                  hover:shadow-md hover:bg-blue-100 z-20"
                style={{
                  top: `${bookingStart}px`,
                  height: `${bookingEnd - bookingStart}px`,
                }}
              >
                <div className="p-2 flex flex-col h-full justify-between">
                  <div className="space-y-1">
                    <div className="flex justify-between items-start">
                      <span className="text-sm font-medium text-slate-700">
                        {`${formatTime(booking.startTime)} - ${formatTime(booking.endTime)}`}
                      </span>
                      <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                        {`${booking.duration} min`}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-slate-700">
                      {booking.client.profile?.fullName || booking.client.email}
                    </p>
                    <p className="text-xs text-slate-500 truncate">
                      {booking.location.address}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DaySchedule;