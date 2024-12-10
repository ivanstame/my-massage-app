import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import ResponsiveCalendar from './ResponsiveCalendar';
import axios from 'axios';
import { usePlacesWidget } from "react-google-autocomplete";

// Simple SVG icons instead of Lucide
const MapPinIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const ClockIcon = () => (
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const convertTo12Hour = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const BookingForm = () => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);
  
  // State management
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [timeOfDay, setTimeOfDay] = useState(null);
  const [selectedDuration, setSelectedDuration] = useState(60);
  const [location, setLocation] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingSuccess, setBookingSuccess] = useState(false);
const [newBookingId, setNewBookingId] = useState(null);
const [mainAddress, setMainAddress] = useState('');
const [unit, setUnit] = useState('');
const [fullAddress, setFullAddress] = useState('');

  // Time period options
  const timePeriods = [
    { id: 'morning', label: 'Morning', icon: '🌅', hours: '6AM - 12PM', color: 'amber' },
    { id: 'afternoon', label: 'Afternoon', icon: '☀️', hours: '12PM - 5PM', color: 'blue' },
    { id: 'evening', label: 'Evening', icon: '🌙', hours: '5PM - 10PM', color: 'indigo' }
  ];

  // Duration options
  const durations = [
    { minutes: 60, label: '60 Minutes', description: 'Standard Session' },
    { minutes: 90, label: '90 Minutes', description: 'Extended Session' },
    { minutes: 120, label: '120 Minutes', description: 'Deep Tissue Focus' }
  ];

  // Google Places setup
  const { ref: addressInputRef } = usePlacesWidget({
    apiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY,
    onPlaceSelected: (place) => {
      if (place.formatted_address) {
        setMainAddress(place.formatted_address);
        setLocation({
          lat: place.geometry.location.lat(),
          lng: place.geometry.location.lng()
        });
        // Combine addresses when either field changes
        const combined = unit 
          ? `${place.formatted_address} Unit ${unit}`
          : place.formatted_address;
        setFullAddress(combined);
      }
    },
    options: {
      componentRestrictions: { country: "us" },
      types: ["address"]
    }
  });

  const filterSlotByPeriod = (slot, period) => {
    const hour = parseInt(slot.split(':')[0]);
    switch(period) {
      case 'morning':
        return hour >= 6 && hour < 12;
      case 'afternoon':
        return hour >= 12 && hour < 17;
      case 'evening':
        return hour >= 17 && hour < 22;
      default:
        return true;
    }
  };

  const fetchAvailableSlots = async () => {
    if (!location || !selectedDuration) return;
    
    setLoading(true);
    try {
      const utcDate = new Date(Date.UTC(selectedDate.getFullYear(), 
        selectedDate.getMonth(), selectedDate.getDate()));
      const dateString = utcDate.toISOString().split('T')[0];

      const hostname = window.location.hostname;
      const response = await axios.get(`http://${hostname}:5000/api/availability/available/${dateString}`, {
        params: {
          duration: selectedDuration,
          lat: location.lat,
          lng: location.lng
        },
        withCredentials: true
      });

      const formattedSlots = response.data.map(slot => ({
        original: slot,
        formatted: convertTo12Hour(slot)
      }));
      setAvailableSlots(formattedSlots);
      setError(null);
    } catch (err) {
      setError('Could not fetch available times');
      console.error('Error fetching slots:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (location && selectedDuration) {
      fetchAvailableSlots();
    }
  }, [selectedDate, location, selectedDuration]);

  const handleSubmit = async () => {
    try {
      const hostname = window.location.hostname;
      const bookingUrl = `http://${hostname}:5000/api/bookings`;
      
      const bookingData = {
        date: `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(selectedDate.getDate()).padStart(2, '0')}`,
        time: selectedTime.original,
        duration: selectedDuration,
        location: {
          address: fullAddress,
          lat: location.lat,
          lng: location.lng
        }
      };
  
      const response = await axios.post(bookingUrl, bookingData, {
        withCredentials: true
      });
  
      setNewBookingId(response.data._id);
      setBookingSuccess(true);
    } catch (error) {
      console.error('Error while creating booking:', error);
      setError('Failed to create booking. Please try again.');
    }
  };

  return (
    <div className="pt-16"> 
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {/* Calendar */}
        <div className="bg-white rounded-lg shadow-sm">
          <ResponsiveCalendar 
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            events={availableSlots.map(slot => ({
              date: selectedDate,
              time: slot
            }))}
          />
        </div>

        {/* Essential Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Address Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3 text-slate-700">
              <MapPinIcon />
              <h3 className="font-medium">Service Location</h3>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <input
                  ref={addressInputRef}
                  type="text"
                  placeholder="Start typing your street address..."
                  className="w-full p-2 border border-slate-200 rounded-md 
                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="text-xs text-slate-500">
                  Please enter your street address
                </div>
              </div>

              {mainAddress && (
                <div className="space-y-2">
                  <input
                    type="text"
                    value={unit}
                    onChange={(e) => {
                      setUnit(e.target.value);
                      const combined = e.target.value 
                        ? `${mainAddress} Unit ${e.target.value}`
                        : mainAddress;
                      setFullAddress(combined);
                    }}
                    placeholder="Apt/Unit/Suite # (if applicable)"
                    className="w-full p-2 border border-slate-200 rounded-md 
                      focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="text-xs text-slate-500">
                    Enter unit number, apartment letter, or "1/2" if applicable
                  </div>
                </div>
              )}

              {fullAddress && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <div className="text-sm font-medium text-blue-700">Confirmed Address:</div>
                  <div className="text-sm text-blue-600">{fullAddress}</div>
                </div>
              )}
            </div>
          </div>

          {/* Duration Card */}
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
            <div className="flex items-center gap-2 mb-3 text-slate-700">
              <ClockIcon />
              <h3 className="font-medium">Session Duration</h3>
            </div>
            <div className="space-y-2">
              {durations.map(duration => (
                <button
                  key={duration.minutes}
                  onClick={() => setSelectedDuration(duration.minutes)}
                  className={`w-full p-2 rounded-md text-left transition-all
                    ${selectedDuration === duration.minutes
                      ? 'bg-blue-50 border-blue-200 text-blue-700'
                      : 'border border-slate-200 hover:border-blue-200'}`}
                >
                  <div className="font-medium">{duration.label}</div>
                  <div className="text-xs text-slate-500">{duration.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Time Period Selection */}
        {mainAddress && selectedDuration && availableSlots.length > 0 && (
          <div className="space-y-4">
            <div className="flex justify-center gap-2">
              {timePeriods.map(period => (
                <button
                  key={period.id}
                  onClick={() => setTimeOfDay(period.id)}
                  className={`relative p-3 rounded-lg transition-all
                    ${timeOfDay === period.id 
                      ? 'bg-slate-700 text-white' 
                      : 'bg-white border border-slate-200 hover:border-slate-300'}`}
                >
                  <div className="text-lg mb-1">{period.icon}</div>
                  <div className="text-sm font-medium">{period.label}</div>
                  <div className="text-xs opacity-75">{period.hours}</div>
                </button>
              ))}
            </div>

            {/* Available Time Slots */}
            {timeOfDay && (
              <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots
                    .filter(slot => filterSlotByPeriod(slot.original, timeOfDay))
                    .map(slot => (
                      <button
                        key={slot.original}
                        onClick={() => setSelectedTime(slot)}
                        className={`p-2 text-center rounded-md border border-slate-200 
                          hover:border-blue-500 hover:bg-blue-50 transition-all
                          ${selectedTime?.original === slot.original ? 'bg-blue-500 text-white' : ''}`}
                      >
                        {slot.formatted}
                      </button>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-8 text-slate-500">
            Finding available times...
          </div>
        )}

        {/* No Slots Available Message */}
        {!loading && mainAddress && selectedDuration && availableSlots.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            No available times found for this date. Try another date or duration.
          </div>
        )}

        {/* Booking Confirmation Button */}
        {selectedTime && (
          <div className="mt-6">
            <button
              onClick={handleSubmit}
              className="w-full py-3 px-4 bg-green-600 text-white rounded-lg
                hover:bg-green-700 transition-colors disabled:opacity-50
                disabled:cursor-not-allowed shadow-sm"
            >
              Confirm Booking
            </button>
          </div>
        )}

        {bookingSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="text-center">
                {/* Success Icon */}
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Booking Confirmed!
                </h3>
                
                <p className="text-sm text-gray-500 mb-6">
                  Your massage session has been scheduled for{' '}
                  {selectedDate.toLocaleDateString('en-US', { 
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                    year: 'numeric'
                  })}{' '}
                  at {selectedTime.formatted}.
                </p>

                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/my-bookings')}
                    className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    View My Bookings
                  </button>

                  <button
                    onClick={() => navigate('/admin')}
                    className="w-full bg-slate-100 text-slate-700 py-2 px-4 rounded-lg hover:bg-slate-200 transition-colors"
                  >
                    Return to Dashboard
                  </button>

                  <button
                    onClick={() => {
                      setSelectedDate(new Date());
                      setSelectedTime(null);
                      setMainAddress('');
                      setLocation(null);
                      setSelectedDuration(60);
                      setTimeOfDay(null);
                      setBookingSuccess(false);
                      window.scrollTo(0, 0);
                    }}
                    className="w-full border border-slate-200 text-slate-600 py-2 px-4 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Book Another Session
                  </button>
                </div>

                <div className="mt-6 text-xs text-slate-500">
                  A confirmation email has been sent to your inbox.
                  <br />
                  Booking Reference: #{newBookingId?.slice(-6)}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BookingForm;