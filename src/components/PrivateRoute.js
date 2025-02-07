import React, { useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

const PrivateRoute = ({ children, adminOnly }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Handle admin-only routes
  if (adminOnly && !user.admin) {
    return <Navigate to="/" />;
  }

  // Handle profile setup requirement for non-admin users
  if (!user.admin && !adminOnly && !user.profileComplete && window.location.pathname !== '/profile-setup') {
    return <Navigate to="/profile-setup" />;
  }

  return children;
};

export default PrivateRoute;