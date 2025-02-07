const rateLimit = require('express-rate-limit');
const User = require('../models/User');

const ensureAuthenticated = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ message: 'Please log in to access this resource' });
};

const ensureGuest = (req, res, next) => {
  if (!req.isAuthenticated || !req.isAuthenticated()) {
    return next();
  }
  res.status(400).json({ message: 'You are already logged in' });
};

const ensureAdmin = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user.isAdmin) {
    return next();
  }
  res.status(403).json({ message: 'Admin access required' });
};

// New middleware functions
const ensureProvider = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && req.user.accountType === 'PROVIDER') {
    return next();
  }
  res.status(403).json({ message: 'Provider access required' });
};

const ensureProviderOrAdmin = (req, res, next) => {
  if (req.isAuthenticated && req.isAuthenticated() && 
      (req.user.accountType === 'PROVIDER' || req.user.isAdmin)) {
    return next();
  }
  res.status(403).json({ message: 'Provider or admin access required' });
};

const validateProviderClient = async (req, res, next) => {
  try {
    if (req.user.accountType !== 'PROVIDER') {
      return next();
    }
    
    const clientId = req.params.clientId || req.body.clientId;
    if (!clientId) {
      return next();
    }

    const client = await User.findById(clientId);
    if (!client || !client.providerId.equals(req.user._id)) {
      return res.status(403).json({ message: 'Client does not belong to provider' });
    }
    next();
  } catch (error) {
    res.status(500).json({ message: 'Error validating client-provider relationship' });
  }
};

const providerRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each provider to 100 requests per windowMs
  message: 'Too many requests from this provider, please try again later'
});

module.exports = {
  ensureAuthenticated,
  ensureGuest,
  ensureAdmin,
  ensureProvider,
  ensureProviderOrAdmin,
  validateProviderClient,
  providerRateLimit
};
