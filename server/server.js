// server/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
require('./config/passport')(passport);
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const User = require('./models/User');
const bookingRoutes = require('./routes/bookings');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const availabilityRoutes = require('./routes/availability');
const geocodeRoutes = require('./routes/geocode');
const { 
  ensureProvider, 
  ensureProviderOrAdmin,
  validateProviderClient,
  providerRateLimit 
} = require('./middleware/passportMiddleware');

const app = express();
const PORT = process.env.PORT || 5000;

// Updated MongoDB connection with modern options
mongoose.connect('mongodb://localhost:27017/massage_booking_app', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true, // This fixes the ensureIndex deprecation warning
  autoIndex: true // Make sure indexes are created
}).then(() => {
  console.log('Connected to MongoDB');
}).catch(err => {
  console.error('MongoDB connection error:', err);
});

app.use((req, res, next) => {
  console.log('Incoming request:', {
    origin: req.headers.origin,
    host: req.headers.host,
    url: req.url,
    method: req.method
  });
  next();
});

// Middleware setup - ORDER IS IMPORTANT
app.use(express.json());

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  /^http:\/\/192\.168\.\d+\.\d+:(3000|5000)$/,
  'https://massagebyivan.com',
  'https://api.massagebyivan.com',
];

app.use(cors({
  origin: function(origin, callback) {
    console.log('CORS Check - Origin:', origin);
    
    if (!origin) {
      return callback(null, true);
    }

    const isAllowed = allowedOrigins.some(allowedOrigin => {
      if (allowedOrigin instanceof RegExp) {
        return allowedOrigin.test(origin);
      }
      return allowedOrigin === origin;
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      console.log('Rejected Origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Session middleware MUST come before passport
app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/massage_booking_app',
    collectionName: 'sessions'
  }),
  cookie: {
    secure: false,
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000
  }
}));

// Passport middleware MUST come after session
app.use(passport.initialize());
app.use(passport.session());

// Routes come after all middleware
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/availability', availabilityRoutes);
app.use('/api/geocode', geocodeRoutes);
app.use('/api/invitations', require('./routes/invitations'));

// Provider-specific routes and rate limiting
const providerApiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: 'Too many requests from this provider, please try again later'
});

app.use('/api/provider', ensureProvider);
app.use('/api/provider', providerApiLimiter);
app.use('/api/provider/availability', require('./routes/availability'));
app.use('/api/provider/bookings', require('./routes/bookings'));

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  
  // Handle provider-specific errors
  if (err.name === 'ProviderValidationError') {
    return res.status(400).json({ 
      message: 'Provider validation failed',
      errors: err.errors 
    });
  }
  
  // Handle client-provider relationship errors
  if (err.name === 'ClientProviderError') {
    return res.status(403).json({ 
      message: 'Invalid client-provider relationship',
      error: err.message 
    });
  }

  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'Server is reachable!' });
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Server is accessible at http://localhost:${PORT}`);
  console.log(`For local network access, use your computer's IP address`);
});
