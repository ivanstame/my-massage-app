// src/App.js
import React, { useContext, useState } from 'react';  // Add useState here
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
import Header from './components/Navigation/Header';
import TreatmentPreferences from './components/TreatmentPreferences';

// Import all components
import Home from './components/Home';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ProfileSetup from './components/ProfileSetup';
import MyProfile from './components/MyProfile';
import BookingForm from './components/BookingForm';
import BookingList from './components/BookingList';
import AdminDashboard from './components/AdminDashboard';
import AdminAvailability from './components/AdminAvailability';
import AdminAppointments from './components/AdminAppointments';

const RegistrationProtectedRoute = ({ children, requiredStep }) => {
  const { user } = useContext(AuthContext);
  
  // Redirect admins to dashboard
  if (user?.isAdmin) return <Navigate to="/admin" />;
  
  const currentStep = user?.registrationStep || 1;
  if (currentStep < requiredStep) {
    if (currentStep === 1) return <Navigate to="/profile-setup" />;
    if (currentStep === 2) return <Navigate to="/treatment-preferences" />;
  }

  return children;
};



// Protected Route Component
const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex items-center justify-center min-h-screen"><div className="text-lg">Loading...</div></div>;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !user.isAdmin) return <Navigate to="/" />;
  
  // Skip registration checks for admins
  if (!adminOnly && !user.isAdmin) {
    const registrationStep = user.registrationStep || 1;
    if (registrationStep < 3) {
      if (registrationStep === 1) return <Navigate to="/profile-setup" />;
      if (registrationStep === 2) return <Navigate to="/treatment-preferences" />;
    }
  }

  return children;
};

function App() {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="App min-h-screen bg-gray-50">
      <Header />
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Routes>
          {/* Public Routes */}
          <Route 
            path="/login" 
            element={user ? <Navigate to="/" /> : <Login />}
          />
          <Route 
            path="/signup" 
            element={user ? <Navigate to="/profile-setup" /> : <SignUp />}
          />

          {/* Registration Flow Routes */}
          <Route 
            path="/profile-setup" 
            element={
              <RegistrationProtectedRoute requiredStep={1}>
                <ProfileSetup />
              </RegistrationProtectedRoute>
            }
          />

          <Route 
            path="/treatment-preferences" 
            element={
              <RegistrationProtectedRoute requiredStep={2}>
                <TreatmentPreferences />
              </RegistrationProtectedRoute>
            }
          />

          {/* Protected Routes (require completed registration) */}
          <Route 
            path="/my-profile" 
            element={
              <ProtectedRoute>
                <MyProfile />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/book" 
            element={
              <ProtectedRoute>
                <BookingForm />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/my-bookings" 
            element={
              <ProtectedRoute>
                <BookingList />
              </ProtectedRoute>
            }
          />

          {/* Admin Routes */}
          <Route 
            path="/admin" 
            element={
              <ProtectedRoute adminOnly>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/admin/availability" 
            element={
              <ProtectedRoute adminOnly>
                <AdminAvailability />
              </ProtectedRoute>
            }
          />

          <Route 
            path="/admin/bookings" 
            element={
              <ProtectedRoute adminOnly>
                <AdminAppointments />
              </ProtectedRoute>
            }
          />

          {/* Default Route */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                <Home />
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route 
            path="*" 
            element={<Navigate to="/" />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;