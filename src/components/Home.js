// src/components/Home.js
import React, { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import { Link } from 'react-router-dom';

const Home = () => {
  const { user } = useContext(AuthContext);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Welcome, {user.profile?.fullName || user.email}!
        </h1>
        
        {user.isAdmin ? (
          <div className="space-y-4">
            <h2 className="text-xl text-gray-700">Admin Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/admin/availability"
                className="bg-blue-100 p-4 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <h3 className="font-bold text-blue-800">Manage Availability</h3>
                <p className="text-blue-600">Set your working hours and breaks</p>
              </Link>
              <Link
                to="/admin/bookings"
                className="bg-green-100 p-4 rounded-lg hover:bg-green-200 transition-colors"
              >
                <h3 className="font-bold text-green-800">View Bookings</h3>
                <p className="text-green-600">Manage upcoming appointments</p>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <h2 className="text-xl text-gray-700">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Link
                to="/book"
                className="bg-blue-100 p-4 rounded-lg hover:bg-blue-200 transition-colors"
              >
                <h3 className="font-bold text-blue-800">Book Appointment</h3>
                <p className="text-blue-600">Schedule your next massage</p>
              </Link>
              <Link
                to="/my-bookings"
                className="bg-purple-100 p-4 rounded-lg hover:bg-purple-200 transition-colors"
              >
                <h3 className="font-bold text-purple-800">My Appointments</h3>
                <p className="text-purple-600">View your upcoming sessions</p>
              </Link>
            </div>
          </div>
        )}
        
        {!user.profile?.fullName && (
          <div className="mt-6 bg-yellow-50 border-l-4 border-yellow-400 p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">Complete Your Profile</h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>Please complete your profile to get personalized massage recommendations.</p>
                  <Link to="/my-profile" className="font-medium underline hover:text-yellow-600">
                    Update Profile
                  </Link>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;