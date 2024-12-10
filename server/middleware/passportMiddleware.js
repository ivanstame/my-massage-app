// server/middleware/passportMiddleware.js

// Ensure authenticated middleware
const ensureAuthenticated = (req, res, next) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: 'Please log in to access this resource' });
  };
  
  // Ensure admin middleware
  const ensureAdmin = (req, res, next) => {
    if (req.isAuthenticated() && req.user.isAdmin) {
      return next();
    }
    res.status(403).json({ message: 'Admin access required' });
  };
  
  // Ensure guest (not logged in) middleware
  const ensureGuest = (req, res, next) => {
    if (!req.isAuthenticated()) {
      return next();
    }
    res.status(400).json({ message: 'You are already logged in' });
  };
  
  // Session checker middleware
  const checkSession = (req, res, next) => {
    if (req.session && req.session.passport) {
      // Refresh session expiry
      req.session.touch();
    }
    next();
  };
  
  // Specialized middleware for massage therapist routes
  const ensureTherapistOrAdmin = (req, res, next) => {
    if (req.isAuthenticated() && (req.user.isAdmin || req.user.isTherapist)) {
      return next();
    }
    res.status(403).json({ message: 'Therapist or admin access required' });
  };
  
  // Optional: Rate limiting for auth routes
  const authRateLimit = (req, res, next) => {
    if (!req.session.loginAttempts) {
      req.session.loginAttempts = 0;
    }
    
    if (req.session.loginAttempts > 5) {
      return res.status(429).json({ 
        message: 'Too many login attempts. Please try again later.',
        timeToWait: 15 * 60 * 1000 // 15 minutes in milliseconds
      });
    }
    
    next();
  };
  
  module.exports = {
    ensureAuthenticated,
    ensureAdmin,
    ensureGuest,
    checkSession,
    ensureTherapistOrAdmin,
    authRateLimit
  };