// server/server.js
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoStore = require('connect-mongo');
const passport = require('passport');
const cors = require('cors');
const bookingRoutes = require('./routes/bookings');
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const availabilityRoutes = require('./routes/availability');

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

// Middleware
// Define allowed origins for development
// server/server.js

const allowedOrigins = [
  // Local development
  'http://localhost:3000',
  'http://localhost:5000',
  // Local network development (mobile testing)
  /^http:\/\/192\.168\.\d+\.\d+:(3000|5000)$/,
  // Production domains (once you have them)
  'https://massagebyivan.com',
  'https://api.massagebyivan.com',
  // Add any other production domains you'll use
];

app.use(cors({
  origin: function(origin, callback) {
    console.log('CORS Check - Origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    // Check if the origin matches any of our allowed patterns
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

app.use(express.json());


app.use(session({
  secret: process.env.SESSION_SECRET || 'your-secret-key',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: 'mongodb://localhost:27017/massage_booking_app',
    collectionName: 'sessions'
  }),
  cookie: {
    secure: false, // Must be false for development
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
}));


// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());
require('./config/passport')(passport);

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/availability', availabilityRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
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