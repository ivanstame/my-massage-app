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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Debug middleware for request body
app.use((req, res, next) => {
  if (req.method === 'POST' && req.path === '/api/availability') {
    console.log('DEBUG - Request body:', req.body);
    console.log('DEBUG - Content-Type:', req.headers['content-type']);
    console.log('DEBUG - Body type:', typeof req.body);
    console.log('DEBUG - Body keys:', Object.keys(req.body));
  }
  next();
});

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:5000',
  'http://192.168.1.26:3000', // Explicit entry for the IP
  'http://192.168.1.26:5000', // Explicit entry for the IP
  /^http:\/\/192\.168\.\d+\.\d+:(3000|5000)$/,
  'https://massagebyivan.com',
  'https://api.massagebyivan.com',
];

app.use(cors({
  origin: function(origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    // Check if the origin is in the allowed list
    if (allowedOrigins.includes(origin) ||
        (typeof allowedOrigins[0] === 'object' && allowedOrigins[0].test(origin))) {
      return callback(null, true);
    }
    
    // Default to localhost:3000 in development or massagebyivan.com in production
    const defaultOrigin = process.env.NODE_ENV === 'production'
      ? 'https://massagebyivan.com'
      : 'http://localhost:3000';
    
    callback(null, defaultOrigin);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Cookie']
}));

// Handle preflight requests
app.options('*', cors());

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
    // In production, secure should be true when sameSite is 'none'
    // In development, we need to allow non-secure cookies
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    // Use 'lax' for same-site requests, 'none' for cross-site
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 24 * 60 * 60 * 1000,
    // Allow cookies from any domain in development
    domain: process.env.NODE_ENV === 'production' ? undefined : ''
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
app.use('/api', require('./routes/direct-access')); // Add direct access routes

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
// Enhanced error handling middleware
app.use((err, req, res, next) => {
  console.error('[Global Error Handler]', err.stack);
  
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
