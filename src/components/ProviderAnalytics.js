import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { 
  LineChart, XAxis, YAxis, Tooltip, Line, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, Users, MapPin, Clock, DollarSign, 
  Calendar, BarChart2, AlertCircle 
} from 'lucide-react';
import axios from 'axios';
import moment from 'moment-timezone';

const ProviderAnalytics = () => {
  const { user } = useContext(AuthContext);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('month'); // week, month, year
  const [analytics, setAnalytics] = useState({
    revenue: [],
    appointments: [],
    clientMetrics: {},
    locationData: [],
    serviceTypes: [],
    travelMetrics: {}
  });

  useEffect(() => {
    if (user?.accountType !== 'PROVIDER') {
      navigate('/login');
      return;
    }

    fetchAnalytics();
  }, [user, timeRange]);

  const fetchAnalytics = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await axios.get('/api/analytics/provider', {
        params: { timeRange }
      });

      setAnalytics(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setError('Failed to load analytics data');
    } finally {
      setIsLoading(false);
    }
  };

  const MetricCard = ({ icon: Icon, label, value, description, trend }) => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-slate-600">{label}</p>
          <p className="mt-2 text-3xl font-semibold text-slate-900">{value}</p>
          {description && (
            <p className="mt-1 text-sm text-slate-500">{description}</p>
          )}
        </div>
        <div className="bg-[#387c7e]/10 p-3 rounded-lg">
          <Icon className="w-6 h-6 text-[#387c7e]" />
        </div>
      </div>
      {trend && (
        <div className="mt-2 flex items-center">
          <TrendingUp 
            className={`w-4 h-4 mr-1 ${
              trend > 0 ? 'text-green-500' : 'text-red-500'
            }`} 
          />
          <span className={`text-sm ${
            trend > 0 ? 'text-green-500' : 'text-red-500'
          }`}>
            {trend}% from last period
          </span>
        </div>
      )}
    </div>
  );

  const RevenueChart = ({ data }) => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-medium text-slate-900 mb-4">Revenue Over Time</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" stroke="#387c7e" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const AppointmentDistribution = ({ data }) => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-medium text-slate-900 mb-4">
        Appointments by Service Type
      </h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              outerRadius={80}
            >
              {data.map((entry, index) => (
                <Cell key={index} fill={`#${Math.floor(Math.random()*16777215).toString(16)}`} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );

  const LocationHeatmap = ({ data }) => (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-medium text-slate-900 mb-4">
        Appointment Locations
      </h3>
      <div className="h-64">
        {/* Implement heat map visualization */}
        <p className="text-slate-500">Heat map coming soon</p>
      </div>
    </div>
  );

  if (isLoading) {
    return (
      <div className="pt-16">
        <div className="max-w-7xl mx-auto p-4">
          <div className="text-center">Loading analytics...</div>
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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Analytics</h1>
            <p className="text-sm text-slate-500 mt-1">
              Track your business performance
            </p>
          </div>
          
          <select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="border rounded-md p-2"
          >
            <option value="week">Last 7 days</option>
            <option value="month">Last 30 days</option>
            <option value="year">Last 12 months</option>
          </select>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={DollarSign}
            label="Total Revenue"
            value={`$${analytics.clientMetrics.totalRevenue || 0}`}
            trend={analytics.clientMetrics.revenueTrend}
          />
          <MetricCard
            icon={Users}
            label="Active Clients"
            value={analytics.clientMetrics.activeClients || 0}
            description="In the last 30 days"
          />
          <MetricCard
            icon={Calendar}
            label="Total Appointments"
            value={analytics.clientMetrics.totalAppointments || 0}
            trend={analytics.clientMetrics.appointmentTrend}
          />
          <MetricCard
            icon={MapPin}
            label="Total Miles"
            value={Math.round(analytics.travelMetrics.totalMiles || 0)}
            description="Distance traveled"
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          <RevenueChart data={analytics.revenue} />
          <AppointmentDistribution data={analytics.serviceTypes} />
        </div>

        {/* Location Data */}
        <div className="mb-6">
          <LocationHeatmap data={analytics.locationData} />
        </div>
      </div>
    </div>
  );
};

export default ProviderAnalytics;
