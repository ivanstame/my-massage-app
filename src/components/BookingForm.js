import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import ResponsiveCalendar from './ResponsiveCalendar';
import axios from 'axios';
import AddressForm from './AddressForm';
import SessionConfigWizard from './SessionConfigWizard';
import { bookingService } from '../services/bookingService';
import api from '../services/api';
import { Users, HourglassIcon, Clock, MapPin, AlertCircle, Check, Calendar, Info } from 'lucide-react';

const convertTo12Hour = (time24) => {
  const [hours, minutes] = time24.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const hours12 = hours % 12 || 12;
  return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
};

const BookingForm = ({ googleMapsLoaded }) => {
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  // Add new provider-related state
  const [provider, setProvider] = useState(null);
  const [serviceArea, setServiceArea] = useState(null);
  const [isOutsideServiceArea, setIsOutsideServiceArea] = useState(false);
  const [useSavedAddr, setUseSavedAddr] = useState(true);

  // Single-session duration
  const [selectedDuration, setSelectedDuration] = useState(null);

  // Get provider info if client, or set as provider if provider
  useEffect(() => {
    const fetchProviderInfo = async () => {
      if (user.accountType === 'CLIENT' && user.providerId) {
        try {
          const response = await api.get(`/api/users/provider/${user.providerId}`);
          setProvider(response.data);
          setServiceArea(response.data.providerProfile.serviceArea);
        } catch (error) {
          console.error('Error fetching provider info:', error);
        }
      } else if (user.accountType === 'PROVIDER') {
        setProvider(user);
        setServiceArea(user.providerProfile.serviceArea);
      }
    };

    fetchProviderInfo();
  }, [user]);

  // Multi-session wizard
  const [numSessions, setNumSessions] = useState(1);
  const [sessionDurations, setSessionDurations] = useState([]);
  const [sessionNames, setSessionNames] = useState([]);
  const [wizardStep, setWizardStep] = useState(0);
  const [isConfiguringDurations, setIsConfiguringDurations] = useState(false);

  // Address
  const [fullAddress, setFullAddress] = useState('');
  const [location, setLocation] = useState(null); // store address object if needed

  // Calendar and time slot selection
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [availableSlots, setAvailableSlots] = useState([]);
  const [selectedTime, setSelectedTime] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Booking success
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [newBookingId, setNewBookingId] = useState(null);
  const [groupId, setGroupId] = useState(null);

  // Session durations
  const durations = [
    { minutes: 60, label: '60 Minutes' },
    { minutes: 90, label: '90 Minutes' },
    { minutes: 120, label: '120 Minutes' }
  ];

  // Modify address validation to check service area
  const handleAddressConfirmed = async (addressData) => {
    setLocation(addressData);
    setFullAddress(addressData.fullAddress);

    if (serviceArea && serviceArea.center) {
      // Calculate distance from service area center
      const R = 6371; // Earth's radius in km
      const lat1 = serviceArea.center.lat * Math.PI / 180;
      const lat2 = addressData.lat * Math.PI / 180;
      const dLat = (addressData.lat - serviceArea.center.lat) * Math.PI / 180;
      const dLon = (addressData.lng - serviceArea.center.lng) * Math.PI / 180;

      const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
               Math.cos(lat1) * Math.cos(lat2) * 
               Math.sin(dLon/2) * Math.sin(dLon/2);
      
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      const distance = R * c;

      setIsOutsideServiceArea(distance > serviceArea.radius);
    }
  };

  useEffect(() => {
    if (
      user &&
      user.accountType === 'CLIENT' &&
      user.profile?.address &&
      useSavedAddr // Corrected state variable name
    ) {
      const { street, unit, city, state, zip } = user.profile.address;
      if (street && city && state && zip) {
        const combinedAddress = `${street}${unit ? ', ' + unit : ''}, ${city}, ${state} ${zip}`;
        setFullAddress(combinedAddress); // Changed to match state setter
  
        // Geocode the saved address immediately
        (async () => {
          try {
            const geo = await api.get('/api/geocode', {
              params: { address: combinedAddress },
            });
            setLocation({ // Changed to match state setter
              lat: geo.data.lat,
              lng: geo.data.lng,
              fullAddress: combinedAddress,
            });
          } catch (err) {
            console.error('Auto-geocode failed', err);
          }
        })();
      }
    }
  }, [user, useSavedAddr]); // Corrected dependency
  
  // Fetch available slots from the server
  const fetchAvailableSlots = async () => {
    if (!fullAddress || (!selectedDuration && !sessionDurations.length)) {
      setAvailableSlots([]);
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const providerId = user.accountType === 'CLIENT' ? user.providerId : user._id;
      
      // First get coordinates from address
      const geocodeResponse = await api.get('/api/geocode', {
        params: { address: fullAddress }
      });

      const { lat, lng } = geocodeResponse.data;

      // Then fetch available slots with provider context
      const response = await api.get(
        `/api/availability/available/${selectedDate.toISOString().split('T')[0]}`,
        {
          params: {
            providerId,
            duration: sessionDurations.length 
              ? sessionDurations.reduce((sum, d) => sum + d, 0) 
              : selectedDuration,
            lat,
            lng,
            isMultiSession: sessionDurations.length > 0,
            sessionDurations: sessionDurations.length ? JSON.stringify(sessionDurations) : null
          }
        }
      ).catch(error => {
        console.error('API Error:', error.response?.data || error.message);
        throw error;
      });

      console.log('API Response:', response.data);

      // Ensure we have an array of slots
      const slots = Array.isArray(response.data) ? response.data 
                   : Array.isArray(response.data.slots) ? response.data.slots 
                   : [];

      console.log('Parsed slots:', slots);
                   
      // Transform
      const formattedSlots = slots.map(slot => ({
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

  // Re-fetch slots if address or selectedDuration changes, etc.
  useEffect(() => {
    const loadSlots = async () => {
      try {
        // Add a check for multi-session scenario
        if (fullAddress && (selectedDuration || sessionDurations.length > 0)) {
          await fetchAvailableSlots();
        }
      } catch (err) {
        console.error('Error in useEffect:', err);
        setError('Failed to load available times');
      }
    };
    
    loadSlots();
  }, [fullAddress, selectedDuration, sessionDurations, selectedDate]);

  const filterSlotByPeriod = (slot, period) => {
    const hour = parseInt(slot.split(':')[0]);
    switch (period) {
      case 'all':
        return true;
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

  // Handle Submit Booking
  const handleSubmit = async () => {
    if (loading) return; // Prevent double submission
    setError(null);
    setLoading(true);
    try {
      if (numSessions === 1) {
        const bookingData = {
          date: selectedDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          time: selectedTime.original,
          duration: selectedDuration,
          location: {
            address: fullAddress,
            lat: location?.lat || null,
            lng: location?.lng || null
          }
        };
        const response = await bookingService.createBooking(bookingData);
        setNewBookingId(response._id);
        setBookingSuccess(true);
      } else {
        // multi-session
        let currentSessionStart = selectedTime.original; 
        // e.g. "12:00" from the first chosen time

        const bookingDataArray = sessionDurations.map((dur, i) => {
          // Parse the currentSessionStart into a date object for arithmetic
          const [startHr, startMin] = currentSessionStart.split(':').map(Number);
          const sessionDateObj = new Date(`${selectedDate.toISOString().split('T')[0]}T${currentSessionStart}`);

          // Build the booking data for THIS session
          const bookingData = {
            date: selectedDate.toISOString().split('T')[0],
            time: currentSessionStart,        // "HH:MM" string
            occupantName: sessionNames[i],
            duration: dur,
            location: {
              address: fullAddress,
              lat: location?.lat || null,
              lng: location?.lng || null
            }
          };

          // Compute the NEXT session's start time by adding `dur` minutes
          // so the next iteration uses that as its starting time
          const nextStartTimeMs = sessionDateObj.getTime() + dur * 60000;
          const nextDateObj = new Date(nextStartTimeMs);
          const endHr = String(nextDateObj.getHours()).padStart(2, '0');
          const endMin = String(nextDateObj.getMinutes()).padStart(2, '0');

          // Update currentSessionStart for the next session in the loop
          currentSessionStart = `${endHr}:${endMin}`;

          return bookingData;
        });
        const response = await api.post('/api/bookings/bulk', bookingDataArray);
        setNewBookingId(response.data[0]._id);
        setBookingSuccess(true);
      }
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.response?.data?.message || 'Failed to create booking. Please try again.');
      setBookingSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  const isBookingComplete = () => {
    return (
      selectedDate &&
      fullAddress &&
      selectedTime &&
      (numSessions === 1
        ? selectedDuration // single session needs selectedDuration
        : (sessionDurations.length === numSessions &&
           sessionDurations.every(dur => dur) &&
           sessionNames.every(name => name)))
    );
  };

  // Add service area warning to the UI
  const ServiceAreaWarning = () => (
    isOutsideServiceArea && (
      <div className="mb-6 p-4 bg-amber-50 border-l-4 border-amber-400 text-amber-700">
        <div className="flex">
          <AlertCircle className="w-5 h-5 mr-2" />
          <div>
            <p className="font-medium">Location Outside Service Area</p>
            <p className="mt-1">
              This address is outside the provider's {serviceArea?.radius} mile service area. 
              Additional travel fees may apply.
            </p>
          </div>
        </div>
      </div>
    )
  );

  return (
    <div className="pt-16">
      <div className="max-w-3xl mx-auto p-4 space-y-6">
        {provider && (
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
            <h2 className="text-lg font-medium text-slate-900">
              Booking with {provider.providerProfile.businessName}
            </h2>
            {serviceArea && (
              <p className="text-sm text-slate-500 flex items-center mt-1">
                <MapPin className="w-4 h-4 mr-1" />
                Service area: {serviceArea.radius} miles
              </p>
            )}
          </div>
        )}


        <ServiceAreaWarning />
        {/* Calendar */}
        <div className={`bg-white rounded-lg shadow-sm relative ${
          !fullAddress ? 'opacity-50 pointer-events-none' : ''
        }`}>
          <ResponsiveCalendar
            selectedDate={selectedDate}
            onDateChange={setSelectedDate}
            events={availableSlots.map(slot => ({
              date: selectedDate,
              time: slot
            }))}
          />
          {!fullAddress && (
            <div className="absolute inset-0 bg-white/50 flex items-center justify-center rounded-lg">
              <p className="text-slate-500">Complete location first</p>
            </div>
          )}
        </div>

        {/* Sticky Progress Indicator - Modified for correct steps */}
        <div className="sticky top-0 z-10 bg-white py-4 mb-8 border-b border-slate-200">
          <div className="max-w-3xl mx-auto px-4">
            <div className="flex items-center justify-between">
              {/* Sessions Step */}
              <div className={`flex items-center ${
                numSessions > 0 && (numSessions === 1 || sessionDurations.length === numSessions) 
                  ? 'text-green-600' 
                  : 'text-blue-600'
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  numSessions > 0 && (numSessions === 1 || sessionDurations.length === numSessions)
                    ? 'bg-green-100' 
                    : 'bg-blue-100'
                }`}>
                  {(numSessions > 0 && (numSessions === 1 || sessionDurations.length === numSessions)) 
                    ? <Check className="w-4 h-4" /> 
                    : <Users className="w-4 h-4" />}
                </div>
                <span className="ml-2 text-sm font-medium">Sessions</span>
              </div>

              {/* Progress Line */}
              <div className={`flex-1 h-1 ${
                numSessions > 0 && (numSessions === 1 || sessionDurations.length === numSessions)
                  ? 'bg-green-100' 
                  : 'bg-slate-200'
              }`}></div>

              {/* Location Step */}
              <div className={`flex items-center ${
                fullAddress 
                  ? 'text-green-600' 
                  : (numSessions > 0 ? 'text-blue-600' : 'text-slate-400')
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  fullAddress 
                    ? 'bg-green-100' 
                    : (numSessions > 0 ? 'bg-blue-100' : 'bg-slate-100')
                }`}>
                  {fullAddress ? <Check className="w-4 h-4" /> : <MapPin className="w-4 h-4" />}
                </div>
                <span className="ml-2 text-sm font-medium">Location</span>
              </div>

              {/* Progress Line */}
              <div className={`flex-1 h-1 ${fullAddress ? 'bg-green-100' : 'bg-slate-200'}`}></div>

              {/* Duration Step */}
              <div className={`flex items-center ${
                (numSessions === 1 ? selectedDuration : sessionDurations.length) 
                  ? 'text-green-600' 
                  : (fullAddress ? 'text-blue-600' : 'text-slate-400')
              }`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                  (numSessions === 1 ? selectedDuration : sessionDurations.length)
                    ? 'bg-green-100' 
                    : (fullAddress ? 'bg-blue-100' : 'bg-slate-100')
                }`}>
                  {(numSessions === 1 ? selectedDuration : sessionDurations.length) 
                    ? <Check className="w-4 h-4" /> 
                    : <HourglassIcon className="w-4 h-4" />}
                </div>
                <span className="ml-2 text-sm font-medium">Duration</span>
              </div>
            </div>

            {/* Instructional Text */}
            {!selectedTime && (
              <div className="mt-4 text-center text-sm text-slate-600">
                {!(numSessions > 0) && "Start by selecting number of sessions"}
                {numSessions > 0 && !fullAddress && "Next, confirm your location"}
                {fullAddress && !(numSessions === 1 ? selectedDuration : sessionDurations.length) && 
                  "Finally, select session duration(s)"}
                {(numSessions === 1 ? selectedDuration : sessionDurations.length) && !selectedDate && 
                  "Now choose a date from the calendar"}
              </div>
            )}
          </div>
        </div>

        {/* 3-column layout: 1) Session or Wizard, 2) Address, 3) Single Duration if needed */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* (1) If isConfiguringDurations, show wizard. Otherwise, show the "Number of Sessions" dropdown or summary */}
          {!isConfiguringDurations ? (
            <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
              <div className="flex items-center mb-3 border-b pb-2">
                <Users className="w-5 h-5 text-blue-500 mr-2" />
                <h2 className="font-medium">Number of Sessions</h2>
              </div>
              
              {numSessions > 1 ? (
                // Multi-session summary
                <div>
                  <div className="p-3 bg-blue-50 rounded-md text-sm text-blue-700 mb-3">
                    <div className="font-medium mb-1">Multi-Session Confirmed:</div>
                    {sessionDurations.map((dur, idx) => (
                      <div key={idx} className="text-blue-800 mb-1">
                        {`Session ${idx + 1}: ${sessionNames[idx] || 'Unknown'} - ${dur} minutes`}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => {
                      setIsConfiguringDurations(true);
                      setWizardStep(0);
                    }}
                    className="w-full px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                  >
                    Edit Sessions
                  </button>
                </div>
              ) : (
                // Single session dropdown
                <select
                  value={numSessions}
                  onChange={(e) => {
                    const count = Number(e.target.value);
                    setNumSessions(count);
                    if (count > 1) {
                      setSessionDurations(Array(count).fill(null));
                      setSessionNames(Array(count).fill(''));
                      setIsConfiguringDurations(true);
                      setWizardStep(0);
                    } else {
                      setSessionDurations([null]);
                      setSessionNames(['']);
                    }
                  }}
                  className="w-full p-2 border border-slate-200 rounded-md hover:border-slate-300 transition-colors"
                >
                  {[1, 2, 3, 4].map(num => (
                    <option key={num} value={num}>
                      {num} {num === 1 ? 'Session' : 'Sessions'}
                    </option>
                  ))}
                </select>
              )}
            </div>
          ) : (
            <SessionConfigWizard
              numSessions={numSessions}
              setNumSessions={setNumSessions}
              sessionDurations={sessionDurations}
              setSessionDurations={setSessionDurations}
              sessionNames={sessionNames}
              setSessionNames={setSessionNames}
              wizardStep={wizardStep}
              setWizardStep={setWizardStep}
              isConfiguringDurations={isConfiguringDurations}
              setIsConfiguringDurations={setIsConfiguringDurations}
              durations={durations}
            />
          )}

          {/* (2) Address Card (traditional) */}
{/* (2) Address Card (traditional) */}
{!fullAddress && (
  <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded-lg mb-4">
    <div className="flex items-center">
      <Info className="w-5 h-5 text-blue-400 mr-2" />
      <div>
        <h3 className="font-medium text-blue-800">Required First Step</h3>
        <p className="text-sm text-blue-700 mt-1">
          Please confirm your service location before viewing availability
        </p>
      </div>
    </div>
  </div>
)}
<div className="bg-white p-4 border">
  {/* The heading we want to show for ANY address option */}
  <div className="flex items-center mb-3 border-b pb-2">
    <MapPin className="w-5 h-5 text-blue-500 mr-2" />
    <h2 className="font-medium">Service Location</h2>
  </div>

  {/* The radio buttons to choose how we pick an address */}
  <div className="mb-4">
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        checked={useSavedAddr}
        onChange={() => setUseSavedAddr(true)}
      />
      <span className="text-sm">Use my saved address</span>
    </label>
    <label className="flex items-center gap-2 cursor-pointer">
      <input
        type="radio"
        checked={!useSavedAddr}
        onChange={() => setUseSavedAddr(false)}
      />
      <span className="text-sm">Enter a different address</span>
    </label>
  </div>

  {/* Display user’s saved address OR the address form, based on radio toggle */}
  {useSavedAddr ? (
    <div className="p-2 bg-gray-50 rounded">
      <p className="text-sm mb-2">Current Address:</p>
      {fullAddress ? (
        <p className="text-sm">{fullAddress}</p>
      ) : (
        <p className="italic text-sm">
          No address found in profile or still loading...
        </p>
      )}
    </div>
  ) : (
    <AddressForm
      onAddressConfirmed={handleAddressConfirmed}
      googleMapsLoaded={googleMapsLoaded}
    />
  )}
</div>

          {/* (3) Single-session Duration if numSessions === 1 */}
          {numSessions === 1 && (
            <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
              <div className="flex items-center gap-2 mb-3 border-b pb-2">
                <HourglassIcon className="w-5 h-5 text-blue-500" />
                <h2 className="font-medium">Session Duration</h2>
              </div>
              <div className="space-y-2">
                {durations.map(duration => (
                  <button
                    key={duration.minutes}
                    onClick={() => setSelectedDuration(duration.minutes)}
                    className={`w-full p-2 rounded-md text-left transition-all ${
                      selectedDuration === duration.minutes
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'border border-slate-200 hover:border-blue-200'
                    }`}
                  >
                    <div className="text-center">{duration.label}</div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Time Period / Available Slots */}
        <div className="space-y-4">
          <div className="bg-white rounded-lg shadow-sm p-4 border border-slate-200">
            <div className="flex items-center mb-3 border-b pb-2">
              <Clock className="w-5 h-5 text-blue-500 mr-2" />
              <h2 className="font-medium">Available Times</h2>
              {!selectedTime && availableSlots.length > 0 && (
                <span className="ml-2 text-sm text-blue-600">(Select a time to continue)</span>
              )}
            </div>

            <div className="space-y-6">
              {/* Morning Section */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Morning</h3>
                <div className="grid grid-cols-4 gap-2">
                  {(!selectedDuration && sessionDurations.length === 0) ? (
                    Array(4).fill(null).map((_, idx) => (
                      <div key={idx} className="p-2 border rounded text-center text-gray-400 bg-gray-50">
                        
                      </div>
                    ))
                  ) : !availableSlots.length ? (
                    Array(4).fill(null).map((_, idx) => (
                      <div key={idx} className="p-2 border rounded text-center text-gray-400 bg-gray-50">
                        
                      </div>
                    ))
                  ) : (
                    availableSlots
                      .filter(slot => filterSlotByPeriod(slot.original, 'morning'))
                      .map(slot => (
                        <button
                          key={slot.original}
                          onClick={() => setSelectedTime(slot)}
                          className={`p-2 text-center rounded border transition-all ${
                            selectedTime?.original === slot.original 
                              ? 'bg-blue-500 text-white border-blue-500' 
                              : 'hover:border-blue-500 hover:bg-blue-50'
                          }`}
                        >
                          {slot.formatted}
                        </button>
                      ))
                  )}
                </div>
              </div>

              {/* Afternoon Section */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Afternoon</h3>
                <div className="grid grid-cols-4 gap-2">
                  {(!selectedDuration && sessionDurations.length === 0) ? (
                    Array(4).fill(null).map((_, idx) => (
                      <div key={idx} className="p-2 border rounded text-center text-gray-400 bg-gray-50">
                        
                      </div>
                    ))
                  ) : !availableSlots.length ? (
                    Array(4).fill(null).map((_, idx) => (
                      <div key={idx} className="p-2 border rounded text-center text-gray-400 bg-gray-50">
                        
                      </div>
                    ))
                  ) : (
                    availableSlots
                      .filter(slot => filterSlotByPeriod(slot.original, 'afternoon'))
                      .map(slot => (
                        <button
                          key={slot.original}
                          onClick={() => setSelectedTime(slot)}
                          className={`p-2 text-center rounded border transition-all ${
                            selectedTime?.original === slot.original 
                              ? 'bg-blue-500 text-white border-blue-500' 
                              : 'hover:border-blue-500 hover:bg-blue-50'
                          }`}
                        >
                          {slot.formatted}
                        </button>
                      ))
                  )}
                </div>
              </div>

              {/* Evening Section */}
              <div>
                <h3 className="text-sm font-medium text-slate-700 mb-2">Evening</h3>
                <div className="grid grid-cols-4 gap-2">
                  {(!selectedDuration && sessionDurations.length === 0) ? (
                    Array(4).fill(null).map((_, idx) => (
                      <div key={idx} className="p-2 border rounded text-center text-gray-400 bg-gray-50">
                        
                      </div>
                    ))
                  ) : !availableSlots.length ? (
                    Array(4).fill(null).map((_, idx) => (
                      <div key={idx} className="p-2 border rounded text-center text-gray-400 bg-gray-50">
                        --:-- --
                      </div>
                    ))
                  ) : (
                    availableSlots
                      .filter(slot => filterSlotByPeriod(slot.original, 'evening'))
                      .map(slot => (
                        <button
                          key={slot.original}
                          onClick={() => setSelectedTime(slot)}
                          className={`p-2 text-center rounded border transition-all ${
                            selectedTime?.original === slot.original 
                              ? 'bg-blue-500 text-white border-blue-500' 
                              : 'hover:border-blue-500 hover:bg-blue-50'
                          }`}
                        >
                          {slot.formatted}
                        </button>
                      ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* BOOKING SUCCESS MODAL */}
        {bookingSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
              <div className="text-center">
                <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Booking Confirmed!
                </h3>
                
                <p className="text-sm text-gray-500 mb-6">
                  {numSessions === 1 ? (
                    `Your single session is scheduled at ${selectedTime?.formatted} on 
                    ${selectedDate.toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })}, address: ${fullAddress}.`
                  ) : (
                    <>
                      <div>
                        {`Your ${numSessions} back-to-back sessions have been scheduled for 
                        ${selectedDate.toLocaleDateString('en-US', {
                          weekday: 'long',
                          month: 'long',
                          day: 'numeric',
                          year: 'numeric'
                        })} at ${selectedTime?.formatted}.`}
                      </div>
                      <div className="mt-2 text-left">
                        {sessionDurations.map((dur, i) => (
                          <div key={i} className="mt-1 pl-4 border-l-2 border-blue-200">
                            <div className="font-medium">
                              {`Session ${i + 1}: ${sessionNames[i] || 'No Name'} (${dur} minutes)`}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="mt-4">
                        {`Address: ${fullAddress}`}
                      </div>
                    </>
                  )}
                </p>

                {/* Next Actions */}
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
                      // Reset everything
                      setSelectedDate(new Date());
                      setSelectedTime(null);
                      setFullAddress('');
                      setLocation(null);
                      setSelectedDuration(null);
                      setNumSessions(1);
                      setSessionDurations([]);
                      setSessionNames([]);
                      setWizardStep(0);
                      setIsConfiguringDurations(false);
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
                  {`Booking Reference: #${newBookingId?.slice(-6)}`}
                </div>
              </div>
            </div>
          </div>
        )}
        {/* Confirm Booking Button */}
        <div className="mt-6">
          <button
            onClick={handleSubmit}
            disabled={!isBookingComplete() || loading}
            className={`w-full py-3 px-4 rounded-lg text-lg font-medium shadow-sm ${
              isBookingComplete() 
                ? 'bg-green-600 text-white hover:bg-green-700 transition-colors'
                : 'bg-slate-200 text-slate-500 cursor-not-allowed'
            }`}
          >
            {loading ? (
              'Processing...'
            ) : isBookingComplete() ? (
              'Confirm Booking'
            ) : (
              'Complete all fields to confirm'
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BookingForm;
