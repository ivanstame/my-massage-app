import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { 
  Users, Mail, UserPlus, AlertCircle, CheckCircle, 
  ExternalLink, MapPin, Clock 
} from 'lucide-react';
import axios from 'axios';

const ProviderClients = () => {
  const { user } = useContext(AuthContext);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteStatus, setInviteStatus] = useState(null);
  const [serviceArea, setServiceArea] = useState(null);

  useEffect(() => {
    if (user?.accountType !== 'PROVIDER') {
      navigate('/login');
      return;
    }
    
    setServiceArea(user.providerProfile?.serviceArea);
    fetchClients();
  }, [user]);

  const fetchClients = async () => {
    try {
      const response = await axios.get('/api/users/provider/clients');
      setClients(response.data);
    } catch (error) {
      console.error('Error fetching clients:', error);
      setError('Failed to fetch clients');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInviteClient = async (e) => {
    e.preventDefault();
    setInviteStatus(null);
    
    try {
      const response = await axios.post('/api/invitations', {
        email: inviteEmail
      });

      setInviteStatus({
        type: 'success',
        message: 'Invitation sent successfully'
      });
      setInviteEmail('');
      setTimeout(() => setShowInviteModal(false), 2000);
    } catch (error) {
      setInviteStatus({
        type: 'error',
        message: error.response?.data?.message || 'Failed to send invitation'
      });
    }
  };

  const isClientOutsideServiceArea = (client) => {
    if (!serviceArea?.center || !client.profile?.address) return false;
    
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

  const InviteModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md">
        <h3 className="text-lg font-medium text-slate-900 mb-4">Invite New Client</h3>
        
        <form onSubmit={handleInviteClient}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Client's Email
            </label>
            <input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
              placeholder="client@example.com"
              required
            />
          </div>

          {inviteStatus && (
            <div className={`mb-4 p-3 rounded-md ${
              inviteStatus.type === 'success' 
                ? 'bg-green-50 text-green-700' 
                : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex items-center">
                {inviteStatus.type === 'success' 
                  ? <CheckCircle className="w-4 h-4 mr-2" />
                  : <AlertCircle className="w-4 h-4 mr-2" />
                }
                {inviteStatus.message}
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowInviteModal(false)}
              className="px-4 py-2 text-slate-700 hover:bg-slate-100 rounded-md"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#387c7e] text-white rounded-md 
                hover:bg-[#2c5f60]"
            >
              Send Invitation
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  return (
    <div className="pt-16">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Client Management</h1>
            <p className="text-sm text-slate-500 mt-1">
              {clients.length} total clients
            </p>
          </div>
          
          <button
            onClick={() => setShowInviteModal(true)}
            className="inline-flex items-center px-4 py-2 bg-[#387c7e] 
              text-white rounded-md hover:bg-[#2c5f60]"
          >
            <UserPlus className="w-5 h-5 mr-2" />
            Invite Client
          </button>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            <div className="flex">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-sm border border-slate-200">
          {isLoading ? (
            <div className="p-6 text-center text-slate-500">Loading clients...</div>
          ) : clients.length === 0 ? (
            <div className="p-6 text-center text-slate-500">
              No clients yet. Invite your first client to get started.
            </div>
          ) : (
            <div className="divide-y divide-slate-200">
              {clients.map(client => (
                <div key={client._id} className="p-6 hover:bg-slate-50">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="text-lg font-medium text-slate-900">
                        {client.profile?.fullName || 'Unnamed Client'}
                      </h3>
                      <div className="mt-1 space-y-1">
                        <div className="flex items-center text-slate-500">
                          <Mail className="w-4 h-4 mr-2" />
                          {client.email}
                        </div>
                        {client.profile?.address && (
                          <div className="flex items-center text-slate-500">
                            <MapPin className="w-4 h-4 mr-2" />
                            {client.profile.address.formatted}
                            {isClientOutsideServiceArea(client) && (
                              <span className="ml-2 text-amber-600 flex items-center">
                                <AlertCircle className="w-4 h-4 mr-1" />
                                Outside service area
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex space-x-2">
                      <button
                        onClick={() => window.location.href = `tel:${client.profile?.phoneNumber}`}
                        className="px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 
                          rounded-md"
                      >
                        Call
                      </button>
                      <button
                        onClick={() => navigate(`/provider/clients/${client._id}`)}
                        className="px-3 py-1.5 text-sm text-[#387c7e] hover:bg-[#387c7e]/10 
                          rounded-md"
                      >
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showInviteModal && <InviteModal />}
    </div>
  );
};

export default ProviderClients;
