import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import { AuthContext } from '../AuthContext';

const BookingList = () => {
  const [upcomingBookings, setUpcomingBookings] = useState([]);
  const [pastBookings, setPastBookings] = useState([]);
  const [showPastBookings, setShowPastBookings] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(AuthContext);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/bookings', {
        withCredentials: true
      });

      if (Array.isArray(response.data)) {
        const now = moment();
        const upcoming = response.data
          .filter(booking => moment(booking.date).isAfter(now))
          .sort((a, b) => moment(a.date).diff(moment(b.date)));
        
        const past = response.data
          .filter(booking => moment(booking.date).isSameOrBefore(now))
          .sort((a, b) => moment(b.date).diff(moment(a.date)));
        
        setUpcomingBookings(upcoming);
        setPastBookings(past);
      } else {
        setError('Unexpected response format');
      }
    } catch (error) {
      setError('Error fetching bookings');
      console.error('Error fetching bookings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelBooking = async (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this booking? This action cannot be undone.')) {
      try {
        await axios.delete(`/api/bookings/${bookingId}`, {
          withCredentials: true
        });
        
        setUpcomingBookings(prev => prev.filter(book => book._id !== bookingId));
        setPastBookings(prev => prev.filter(book => book._id !== bookingId));
        
        alert('Booking cancelled successfully.');
      } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Failed to cancel booking. Please try again.');
      }
    }
  };

  const formatDate = (dateString) => {
    return moment.utc(dateString).format('dddd, MMMM D, YYYY');
  };

  const formatTime = (timeString) => {
    return moment.utc(`1970-01-01T${timeString}`).format('h:mm A');
  };

  const handleAddToCalendar = (booking) => {
    const startTime = moment.utc(`${booking.date.split('T')[0]}T${booking.startTime}`);
    const endTime = moment.utc(`${booking.date.split('T')[0]}T${booking.endTime}`);
    const title = 'Massage Appointment';
    const location = booking.location?.address;

    // Format for Google Calendar
    const googleUrl = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(title)}&dates=${startTime.format('YYYYMMDDTHHmmss')}Z/${endTime.format('YYYYMMDDTHHmmss')}Z&location=${encodeURIComponent(location)}`;
    window.open(googleUrl, '_blank');
  };

  const renderBooking = (booking) => (
    <div
      key={booking._id}
      className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden
        transition duration-200 ease-in-out hover:shadow-md mb-4"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-slate-900">
              {formatDate(booking.date)}
            </h3>
            <div className="mt-2 space-y-2">
              <p className="text-sm text-slate-600">
                <span className="font-medium">Time:</span> {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Duration:</span> {booking.duration} minutes
              </p>
              <p className="text-sm text-slate-600">
                <span className="font-medium">Location:</span> {booking.location?.address || 'Unknown'}
              </p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <span className={`px-3 py-1 rounded-full text-sm font-medium
              ${moment(booking.date).isAfter(moment()) 
                ? 'bg-green-100 text-green-800' 
                : 'bg-slate-100 text-slate-800'}`}
            >
              {moment(booking.date).isAfter(moment()) ? 'Upcoming' : 'Past'}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
          <button 
            className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300
              text-sm font-medium rounded-md text-slate-700 hover:bg-slate-50
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              transition-colors duration-200 ease-in-out"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" 
              />
            </svg>
            Call
          </button>

          <button 
            className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300
              text-sm font-medium rounded-md text-slate-700 hover:bg-slate-50
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              transition-colors duration-200 ease-in-out"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" 
              />
            </svg>
            Text
          </button>

          <button
            onClick={() => handleAddToCalendar(booking)}
            className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300
              text-sm font-medium rounded-md text-slate-700 hover:bg-slate-50
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
              transition-colors duration-200 ease-in-out"
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
              />
            </svg>
            Add to Calendar
          </button>

          <button 
            className="inline-flex items-center px-3 py-1.5 bg-white border border-red-300
              text-sm font-medium rounded-md text-red-700 hover:bg-red-50
              focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500
              transition-colors duration-200 ease-in-out"
            onClick={() => handleCancelBooking(booking._id)}
          >
            <svg className="w-4 h-4 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" 
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" 
              />
            </svg>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16"> 
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-[40px] leading-tight text-slate-900 mb-6">
              My Bookings
            </h1>

            {isLoading ? (
              <div className="text-center py-12">
                <div className="inline-flex items-center px-4 py-2 font-semibold leading-6 text-slate-700">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Loading bookings...
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <div>
                  <h2 className="text-lg font-medium text-slate-900 mb-4">Upcoming Bookings</h2>
                  {upcomingBookings.length > 0 ? (
                    <div className="space-y-4">
                      {upcomingBookings.map(renderBooking)}
                    </div>
                  ) : (
                    <p className="text-slate-500">No upcoming bookings.</p>
                  )}
                  
                  <button
                    onClick={() => setShowPastBookings(!showPastBookings)}
                    className="mt-6 text-slate-500 hover:text-slate-700 text-sm font-medium italic"
                  >
                    {showPastBookings ? 'Hide past bookings' : 'View past bookings'}
                  </button>
                </div>

                {showPastBookings && (
                  <div>
                    <h2 className="text-lg font-medium text-slate-900 mb-4">Past Bookings</h2>
                    {pastBookings.length > 0 ? (
                      <div className="space-y-4">
                        {pastBookings.map(renderBooking)}
                      </div>
                    ) : (
                      <p className="text-slate-500">No past bookings.</p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookingList;