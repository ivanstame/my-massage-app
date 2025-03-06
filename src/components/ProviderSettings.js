import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { Settings, MapPin, Clock, CreditCard, Sliders, AlertCircle } from 'lucide-react';
import axios from 'axios';

const ProviderSettings = () => {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [settings, setSettings] = useState({
    businessName: '',
    scheduling: {
      defaultDuration: 60,
      bufferTime: 15,
      advanceBooking: 30,
      maxDailyBookings: 8
    },
    services: [],
    pricing: {
      baseRate: 0,
      travelFeePerMile: 0,
      minimumFee: 0
    }
  });

  // Load initial settings
  useEffect(() => {
    if (user?.providerProfile) {
      setSettings({
        ...settings,
        businessName: user.providerProfile.businessName || '',
        scheduling: user.providerProfile.scheduling || settings.scheduling,
        services: user.providerProfile.services || [],
        pricing: user.providerProfile.pricing || settings.pricing
      });
    }
  }, [user]);

  const handleSave = async () => {
    setIsLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await axios.put('/api/users/provider/settings', {
        settings
      });

      setSuccessMessage('Settings saved successfully');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error) {
      setError(error.response?.data?.message || 'Failed to save settings');
    } finally {
      setIsLoading(false);
    }
  };


  const SchedulingSettings = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Clock className="w-5 h-5 text-[#387c7e]" />
        <h3 className="font-medium text-slate-900">Scheduling</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Default Appointment Duration
          </label>
          <select
            value={settings.scheduling.defaultDuration}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              scheduling: {
                ...prev.scheduling,
                defaultDuration: parseInt(e.target.value)
              }
            }))}
            className="w-full p-2 border rounded-md"
          >
            <option value={60}>60 minutes</option>
            <option value={90}>90 minutes</option>
            <option value={120}>120 minutes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Buffer Time Between Appointments
          </label>
          <select
            value={settings.scheduling.bufferTime}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              scheduling: {
                ...prev.scheduling,
                bufferTime: parseInt(e.target.value)
              }
            }))}
            className="w-full p-2 border rounded-md"
          >
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={45}>45 minutes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Maximum Daily Bookings
          </label>
          <input
            type="number"
            min="1"
            max="12"
            value={settings.scheduling.maxDailyBookings}
            onChange={(e) => setSettings(prev => ({
              ...prev,
              scheduling: {
                ...prev.scheduling,
                maxDailyBookings: parseInt(e.target.value)
              }
            }))}
            className="w-full p-2 border rounded-md"
          />
        </div>
      </div>
    </div>
  );

  const ServicesSettings = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sliders className="w-5 h-5 text-[#387c7e]" />
        <h3 className="font-medium text-slate-900">Services</h3>
      </div>

      <div className="space-y-4">
        {['Swedish Massage', 'Deep Tissue', 'Sports Massage', 'Prenatal Massage'].map(service => (
          <label key={service} className="flex items-center space-x-3">
            <input
              type="checkbox"
              checked={settings.services.includes(service)}
              onChange={(e) => {
                if (e.target.checked) {
                  setSettings(prev => ({
                    ...prev,
                    services: [...prev.services, service]
                  }));
                } else {
                  setSettings(prev => ({
                    ...prev,
                    services: prev.services.filter(s => s !== service)
                  }));
                }
              }}
              className="form-checkbox h-5 w-5 text-[#387c7e]"
            />
            <span className="text-slate-700">{service}</span>
          </label>
        ))}
      </div>
    </div>
  );

  const PricingSettings = () => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <CreditCard className="w-5 h-5 text-[#387c7e]" />
        <h3 className="font-medium text-slate-900">Pricing</h3>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Base Rate (per hour)
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              min="0"
              step="5"
              value={settings.pricing.baseRate}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                pricing: {
                  ...prev.pricing,
                  baseRate: parseFloat(e.target.value)
                }
              }))}
              className="block w-full rounded-md pl-7 pr-12"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Travel Fee (per mile)
          </label>
          <div className="relative mt-1 rounded-md shadow-sm">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
              <span className="text-slate-500 sm:text-sm">$</span>
            </div>
            <input
              type="number"
              min="0"
              step="0.50"
              value={settings.pricing.travelFeePerMile}
              onChange={(e) => setSettings(prev => ({
                ...prev,
                pricing: {
                  ...prev.pricing,
                  travelFeePerMile: parseFloat(e.target.value)
                }
              }))}
              className="block w-full rounded-md pl-7 pr-12"
            />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="pt-16">
      <div className="max-w-7xl mx-auto p-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Provider Settings</h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage your business preferences
            </p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-400 text-red-700">
            <div className="flex">
              <AlertCircle className="w-5 h-5 mr-2" />
              <p>{error}</p>
            </div>
          </div>
        )}

        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border-l-4 border-green-400 text-green-700">
            <div className="flex">
              <CheckCircle className="w-5 h-5 mr-2" />
              <p>{successMessage}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <SchedulingSettings />
          <ServicesSettings />
          <PricingSettings />
        </div>

        <div className="mt-6 flex justify-end">
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-4 py-2 bg-[#387c7e] text-white rounded-md 
              hover:bg-[#2c5f60] disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProviderSettings;
