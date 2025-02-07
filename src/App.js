// src/App.js
import React, { useContext, useState, useEffect } from 'react';
import MyProfile from './components/MyProfile';


// Google Maps Script Loader
const loadGoogleMapsScript = () => {
  const script = document.createElement('script');
  script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.REACT_APP_GOOGLE_MAPS_API_KEY}&libraries=places`;
  script.async = true;
  script.defer = true;
  document.head.appendChild(script);
  
  return new Promise((resolve, reject) => {
    script.onload = resolve;
    script.onerror = reject;
  });
};
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthContext } from './AuthContext';
// import Header from './components/Navigation/Header';
import TreatmentPreferences from './components/TreatmentPreferences';

// Import original components
import Header from './components/Navigation/Header';
import Home from './components/Home';
import Login from './components/Login';
import SignUp from './components/SignUp';
import ProfileSetup from './components/ProfileSetup';
import BookingForm from './components/BookingForm';
import BookingList from './components/BookingList';

// Import new provider components
import ProviderDashboard from './components/ProviderDashboard';
import ProviderAvailability from './components/ProviderAvailability';
import ProviderAppointments from './components/ProviderAppointments';
import ProviderClients from './components/ProviderClients';
import ProviderClientDetails from './components/ProviderClientDetails';
import ProviderAnalytics from './components/ProviderAnalytics';
import ProviderSettings from './components/ProviderSettings';
import ProviderProfile from './components/ProviderProfile';
import InvitationHandling from './components/InvitationHandling';
import TestInvitationManager from './components/TestInvitationManager';

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



// Protected Route Components
const ProtectedRoute = ({ children, providerOnly = false }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (providerOnly && user.accountType !== 'PROVIDER') {
    return <Navigate to="/" />;
  }

  return children;
};

function App() {
  const { user, loading } = useContext(AuthContext);
  const [googleMapsLoaded, setGoogleMapsLoaded] = useState(false);

  useEffect(() => {
    loadGoogleMapsScript()
      .then(() => setGoogleMapsLoaded(true))
      .catch((error) => console.error('Error loading Google Maps:', error));
  }, []);

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
                <BookingForm googleMapsLoaded={googleMapsLoaded} />
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

          {/* Provider Routes */}
          <Route 
            path="/provider" 
            element={
              <ProtectedRoute providerOnly>
                <ProviderDashboard />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/provider/availability" 
            element={
              <ProtectedRoute providerOnly>
                <ProviderAvailability />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/provider/appointments" 
            element={
              <ProtectedRoute providerOnly>
                <ProviderAppointments />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/provider/clients" 
            element={
              <ProtectedRoute providerOnly>
                <ProviderClients />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/provider/clients/:clientId" 
            element={
              <ProtectedRoute providerOnly>
                <ProviderClientDetails />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/provider/analytics" 
            element={
              <ProtectedRoute providerOnly>
                <ProviderAnalytics />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/provider/settings" 
            element={
              <ProtectedRoute providerOnly>
                <ProviderSettings />
              </ProtectedRoute>
            }
          />
          <Route 
            path="/provider/:providerId/profile" 
            element={<ProviderProfile />}
          />

          {/* Client Routes */}

          {/* Home/Default Route */}
          <Route 
            path="/" 
            element={
              <ProtectedRoute>
                {user?.accountType === 'PROVIDER' ? <Navigate to="/provider" /> : <Home />}
              </ProtectedRoute>
            }
          />

          {/* Catch all route */}
          <Route 
            path="*" 
            element={<Navigate to="/" />}
          />

          {/* Test Invitations */}
          <Route 
            path="/provider/test-invites" 
            element={
              <ProtectedRoute providerOnly>
                <TestInvitationManager />
              </ProtectedRoute>
            }
          />

          {/* Invitation Handling */}
          <Route 
            path="/invitation/:token" 
            element={<InvitationHandling />}
          />
        </Routes>
      </main>
    </div>
  );
}

export default App;
