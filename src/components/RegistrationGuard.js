// src/components/RegistrationGuard.js
import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const registrationFlowRoutes = {
  1: '/profile-setup',
  2: '/treatment-preferences',
  3: '/'  // Final destination after completing registration
};

const RegistrationGuard = ({ children, requiredStep }) => {
  const { user } = useContext(AuthContext);
  
  // If no user, redirect to login
  if (!user) {
    return <Navigate to="/login" />;
  }

  const currentStep = user.registrationStep || 1;

  // If trying to access a future step, redirect to current step
  if (currentStep < requiredStep) {
    return <Navigate to={registrationFlowRoutes[currentStep]} />;
  }

  // If trying to access a completed step, redirect to current step
  if (currentStep > requiredStep) {
    return <Navigate to={registrationFlowRoutes[currentStep]} />;
  }

  return children;
};

export default RegistrationGuard;