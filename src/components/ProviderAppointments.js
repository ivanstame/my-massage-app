import React, { useEffect, useState, useContext } from 'react';
import axios from 'axios';
import moment from 'moment-timezone';
import { AuthContext } from '../AuthContext';
import { Calendar, MapPin, Clock, Phone, MessageSquare, AlertTriangle } from 'lucide-react';

const ProviderAppointments = () => {
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [pastAppointments, setPastAppointments] = useState([]);
  const [showPastAppointments, setShowPastAppointments] = useState(false);
  const [error, setError] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useContext(AuthContext);
  const [serviceArea, setServiceArea] = useState(null);

  useEffect(() => {
    if (user?.providerProfile?.serviceArea) {
      setServiceArea(user.providerProfile.serviceArea);
    }
  }, [user]);

  useEffect(() => {
    fetchAppointments();
  }, []);

  const fetchAppointments = async () => {
    try {
      setIsLoading(true);
      const response = await axios.get('/api/bookings', {
        withCredentials: true
      });

      if (Array.isArray(response.data)) {
        const now = moment().utc();
        
        // Filter appointments by provider
        const providerAppointments = response.data.filter(
          appointment => appointment.provider === user._id
        );

        const upcoming = providerAppointments
          .filter(appointment => {
            const appointmentEnd = moment.utc(appointment.date)
              .set('hour', parseInt(appointment.endTime.split(':')[0]))
              .set('minute', parseInt(appointment.endTime.split(':')[1]));
            return appointmentEnd.isAfter(now);
          })
          .sort((a, b) => moment.utc(a.date).diff(moment.utc(b.date)));

        const past = providerAppointments
          .filter(appointment => {
            const appointmentEnd = moment.utc(appointment.date)
              .set('hour', parseInt(appointment.endTime.split(':')[0]))
              .set('minute', parseInt(appointment.endTime.split(':')[1]));
            return appointmentEnd.isSameOrBefore(now);
          })
          .sort((a, b) => moment.utc(b.date).diff(moment.utc(a.date)));

        setUpcomingAppointments(upcoming);
        setPastAppointments(past);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      setError('Error fetching appointments');
    } finally {
      setIsLoading(false);
    }
  };

  const isOutsideServiceArea = (location) => {
    if (!serviceArea || !serviceArea.center || !location) return false;
    
    // Calculate distance from service area center
    const R = 6371; // Earth's radius in km
    const lat1 = serviceArea.center.lat * Math.PI / 180;
    const lat2 = location.lat * Math.PI / 180;
    const dLat = (location.lat - serviceArea.center.lat) * Math.PI / 180;
    const dLon = (location.lng - serviceArea.center.lng) * Math.PI / 180;

    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
             Math.cos(lat1) * Math.cos(lat2) * 
             Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;

    return distance > serviceArea.radius;
  };

  const renderAppointment = (appointment) => (
    <div
      key={appointment._id}
      className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden
        transition duration-200 ease-in-out hover:shadow-md mb-4"
    >
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-lg font-medium text-slate-900">
              {appointment.client?.profile?.fullName || appointment.client?.email}
            </h3>
            <div className="mt-2 space-y-2">
              <div className="flex items-center text-slate-600">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{moment(appointment.date).format('dddd, MMMM D, YYYY')}</span>
              </div>
              <div className="flex items-center text-slate-600">
                <Clock className="w-4 h-4 mr-2" />
                <span>
                  {moment(appointment.startTime, 'HH:mm').format('h:mm A')} - 
                  {moment(appointment.endTime, 'HH:mm').format('h:mm A')}
                </span>
              </div>
              <div className="flex items-center text-slate-600">
                <MapPin className="w-4 h-4 mr-2" />
                <span>{appointment.location?.address}</span>
                {isOutsideServiceArea(appointment.location) && (
                  <span className="ml-2 text-amber-600 flex items-center">
                    <AlertTriangle className="w-4 h-4 mr-1" />
                    Outside service area
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-slate-200">
          <button 
            className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300
              text-sm font-medium rounded-md text-slate-700 hover:bg-slate-50"
            onClick={() => window.location.href = `tel:${appointment.client?.profile?.phoneNumber}`}
          >
            <Phone className="w-4 h-4 mr-1.5" />
            Call Client
          </button>

          <button 
            className="inline-flex items-center px-3 py-1.5 bg-white border border-slate-300
              text-sm font-medium rounded-md text-slate-700 hover:bg-slate-50"
            onClick={() => window.location.href = `sms:${appointment.client?.profile?.phoneNumber}`}
          >
            <MessageSquare className="w-4 h-4 mr-1.5" />
            Text Client
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pt-16">
      <div className="max-w-7xl mx-auto p-4">
        <div className="bg-white shadow-sm rounded-lg overflow-hidden">
          <div className="p-6">
            <h1 className="text-2xl font-bold text-slate-900 mb-6">Appointments</h1>

            {error && (
              <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-400">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            {isLoading ? (
              <div className="text-center py-8">
                <p className="text-slate-600">Loading appointments...</p>
              </div>
            ) : (
              <>
                <div className="space-y-4">
                  {upcomingAppointments.length > 0 ? (
                    upcomingAppointments.map(renderAppointment)
                  ) : (
                    <div className="text-center py-8">
                      <p className="text-slate-600">No upcoming appointments</p>
                    </div>
                  )}
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => setShowPastAppointments(!showPastAppointments)}
                    className="text-[#387c7e] hover:text-[#2c5f60] font-medium"
                  >
                    {showPastAppointments ? 'Hide' : 'Show'} Past Appointments
                  </button>

                  {showPastAppointments && (
                    <div className="mt-4 space-y-4">
                      {pastAppointments.length > 0 ? (
                        pastAppointments.map(renderAppointment)
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-slate-600">No past appointments</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderAppointments;
