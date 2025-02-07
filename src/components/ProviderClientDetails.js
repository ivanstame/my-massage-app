import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';
import { 
  User, Phone, Mail, MapPin, Calendar, Clock, 
  AlertCircle, MessageSquare, FileText, 
  MoreHorizontal, Trash2 
} from 'lucide-react';
import axios from 'axios';
import moment from 'moment-timezone';

const ProviderClientDetails = () => {
  const { clientId } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  
  const [client, setClient] = useState(null);
  const [appointments, setAppointments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [serviceArea, setServiceArea] = useState(null);

  useEffect(() => {
    if (user?.accountType !== 'PROVIDER') {
      navigate('/login');
      return;
    }
    
    setServiceArea(user.providerProfile?.serviceArea);
    fetchClientDetails();
    fetchClientAppointments();
  }, [clientId, user]);

  const fetchClientDetails = async () => {
    try {
      const response = await axios.get(`/api/users/provider/clients/${clientId}`);
      setClient(response.data);
    } catch (error) {
      console.error('Error fetching client details:', error);
      setError('Failed to load client details');
    }
  };

  const fetchClientAppointments = async () => {
    try {
      const response = await axios.get(`/api/bookings`, {
        params: { clientId, providerId: user._id }
      });
      setAppointments(response.data);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isOutsideServiceArea = () => {
    if (!serviceArea?.center || !client?.profile?.address) return false;
    
    const location = {
      lat: client.profile.address.lat,
      lng: client.profile.address.lng
    };

    const R = 6371;
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

  const handleRemoveClient = async () => {
    try {
      await axios.delete(`/api/users/provider/clients/${clientId}`);
      navigate('/provider/clients');
    } catch (error) {
      setError('Failed to remove client');
    }
  };

  const DeleteConfirmationModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Remove Client</h3>
        <p className="text-slate-500 mb-4">
          Are you sure you want to remove this client? This action cannot be undone.
        </p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={() => setShowDeleteConfirm(false)}
            className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
          >
            Cancel
          </button>
          <button
            onClick={handleRemoveClient}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
          >
            Remove Client
          </button>
        </div>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="pt-16">
        <div className="max-w-7xl mx-auto p-4">
          <div className="text-center">Loading client details...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="pt-16">
        <div className="max-w-7xl mx-auto p-4">
          <div className="bg-red-50 border-l-4 border-red-400 p-4 text-red-700">
            <div className="flex">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-16">
      <div className="max-w-7xl mx-auto p-4">
        {/* Client Header */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <div className="flex justify-between items-start">
            <div className="flex items-start space-x-4">
              <div className="bg-slate-100 p-3 rounded-full">
                <User className="w-6 h-6 text-slate-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  {client?.profile?.fullName || 'Unnamed Client'}
                </h1>
                <div className="mt-2 space-y-1">
                  <div className="flex items-center text-slate-600">
                    <Mail className="w-4 h-4 mr-2" />
                    {client?.email}
                  </div>
                  {client?.profile?.phoneNumber && (
                    <div className="flex items-center text-slate-600">
                      <Phone className="w-4 h-4 mr-2" />
                      {client.profile.phoneNumber}
                    </div>
                  )}
                  {client?.profile?.address && (
                    <div className="flex items-center text-slate-600">
                      <MapPin className="w-4 h-4 mr-2" />
                      {client.profile.address.formatted}
                      {isOutsideServiceArea() && (
                        <span className="ml-2 text-amber-600 flex items-center">
                          <AlertCircle className="w-4 h-4 mr-1" />
                          Outside service area
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => window.location.href = `tel:${client?.profile?.phoneNumber}`}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
              >
                <Phone className="w-5 h-5" />
              </button>
              <button
                onClick={() => window.location.href = `sms:${client?.profile?.phoneNumber}`}
                className="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
              >
                <MessageSquare className="w-5 h-5" />
              </button>
              <div className="relative">
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  className="p-2 text-slate-600 hover:bg-slate-100 rounded-md"
                >
                  <MoreHorizontal className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Medical Info Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-6">
          <h2 className="text-lg font-medium text-slate-900 mb-4">Medical Information</h2>
          <div className="space-y-4">
            <div>
              <h3 className="text-sm font-medium text-slate-700">Allergies</h3>
              <p className="mt-1 text-slate-600">
                {client?.profile?.allergies || 'None reported'}
              </p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-slate-700">Medical Conditions</h3>
              <p className="mt-1 text-slate-600">
                {client?.profile?.medicalConditions || 'None reported'}
              </p>
            </div>
          </div>
        </div>

        {/* Appointments Section */}
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-medium text-slate-900">Appointment History</h2>
            <button
              onClick={() => navigate('/provider/calendar')}
              className="text-[#387c7e] hover:text-[#2c5f60]"
            >
              Schedule New
            </button>
          </div>
          
          {appointments.length === 0 ? (
            <p className="text-slate-500">No appointments found</p>
          ) : (
            <div className="space-y-4">
              {appointments.map(appointment => (
                <div 
                  key={appointment._id}
                  className="flex justify-between items-center p-4 hover:bg-slate-50 rounded-lg"
                >
                  <div className="flex items-start space-x-3">
                    <Calendar className="w-5 h-5 text-slate-400" />
                    <div>
                      <div className="font-medium text-slate-900">
                        {moment(appointment.date).format('dddd, MMMM D, YYYY')}
                      </div>
                      <div className="text-sm text-slate-500">
                        {moment(appointment.startTime, 'HH:mm').format('h:mm A')} - 
                        {moment(appointment.endTime, 'HH:mm').format('h:mm A')}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => navigate(`/provider/appointments/${appointment._id}`)}
                      className="text-slate-600 hover:text-slate-900"
                    >
                      <FileText className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showDeleteConfirm && <DeleteConfirmationModal />}
    </div>
  );
};

export default ProviderClientDetails;
