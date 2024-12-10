import React from 'react';
import { Link } from 'react-router-dom';

const AdminDashboard = () => {
  return (
    <div className="pt-16"> 
      <div className="max-w-4xl mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link to="/admin/appointments" className="bg-blue-500 text-white p-4 rounded-lg hover:bg-blue-600 text-center">
            Manage Appointments
          </Link>
          <Link to="/admin/availability" className="bg-green-500 text-white p-4 rounded-lg hover:bg-green-600 text-center">
            Set Availability
          </Link>
          {/* Add more admin options here as needed */}
        </div>
      </div>
    </div>
    );
};

export default AdminDashboard;