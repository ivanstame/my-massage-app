const express = require('express');
const router = express.Router();
const passport = require('passport');
const User = require('../models/User');
const { ensureAuthenticated, ensureGuest, authRateLimit } = require('../middleware/passportMiddleware');

// @route   POST api/auth/register
// @desc    Register user and log them in
// @access  Public
router.post('/register', ensureGuest, async (req, res) => {
  console.log('Register request received:', { ...req.body, password: '[HIDDEN]' });
  
  try {
    const { email, password } = req.body;

    // Check for existing user
    let user = await User.findByEmail(email);
    if (user) {
      console.log('Registration failed: User exists');
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create new user
    user = new User({ email, password });
    await user.save();
    
    // Log the user in automatically
    req.login(user, (err) => {
      if (err) {
        console.error('Auto-login failed:', err);
        return res.status(500).json({ message: 'Registration successful but login failed' });
      }
      
      return res.status(201).json({
        message: 'Registration successful',
        user: user.getPublicProfile()
      });
    });

  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ message: 'Server error during registration' });
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & create session
// @access  Public
router.post('/login', async (req, res, next) => {
  passport.authenticate('local', async (err, user, info) => {
    try {
      if (err) {
        console.error('Login error:', err);
        return res.status(500).json({ message: 'Login error occurred' });
      }

      if (!user) {
        // Increment failed login attempts
        req.session.loginAttempts = (req.session.loginAttempts || 0) + 1;
        return res.status(401).json({ message: info.message || 'Invalid credentials' });
      }

      req.login(user, async (loginErr) => {
        if (loginErr) {
          console.error('Session creation error:', loginErr);
          return res.status(500).json({ message: 'Error creating session' });
        }

        try {
          // Update last login timestamp
          await user.updateLoginTimestamp();
          
          // Reset login attempts on successful login
          req.session.loginAttempts = 0;

          return res.json({
            message: 'Login successful',
            user: user.toJSON()
          });
        } catch (updateErr) {
          console.error('Error updating login timestamp:', updateErr);
          // Still return success even if timestamp update fails
          return res.json({
            message: 'Login successful',
            user: user.toJSON()
          });
        }
      });
    } catch (error) {
      console.error('Unexpected error during login:', error);
      return res.status(500).json({ message: 'An unexpected error occurred' });
    }
  })(req, res, next);
});

// @route   POST api/auth/admin-login
// @desc    Admin login & session creation
// @access  Public
router.post('/admin-login', ensureGuest, authRateLimit, (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Admin login error:', err);
      return res.status(500).json({ message: 'Login error occurred' });
    }

    if (!user || !user.isAdmin) {
      req.session.loginAttempts = (req.session.loginAttempts || 0) + 1;
      return res.status(401).json({ message: 'Invalid admin credentials' });
    }

    req.login(user, (err) => {
      if (err) {
        return res.status(500).json({ message: 'Error creating admin session' });
      }

      req.session.loginAttempts = 0;
      res.json({
        message: 'Admin login successful',
        user: user.getPublicProfile()
      });
    });
  })(req, res, next);
});

// @route   POST api/auth/logout
// @desc    Logout user & destroy session
// @access  Private
router.post('/logout', ensureAuthenticated, (req, res) => {
  const wasAdmin = req.user?.isAdmin;
  
  req.logout((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Error during logout' });
    }

    req.session.destroy((err) => {
      if (err) {
        console.error('Session destruction error:', err);
        return res.status(500).json({ message: 'Error clearing session' });
      }

      res.json({ 
        message: `${wasAdmin ? 'Admin' : 'User'} logged out successfully`
      });
    });
  });
});

// @route   GET api/auth/current-user
// @desc    Get current user's data
// @access  Private
router.get('/current-user', ensureAuthenticated, async (req, res) => {
  const freshUser = await User.findById(req.user._id);
  if (!freshUser) {
    return res.status(404).json({ message: 'User not found' });
  }
  res.json({ user: freshUser.getPublicProfile() });
});
// router.get('/current-user', ensureAuthenticated, async (req, res) => {
//   try {
//     const user = await User.findById(req.user._id);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
//     res.json({ user: user.getPublicProfile() });
//   } catch (err) {
//     console.error('Error fetching current user:', err);
//     res.status(500).json({ message: 'Error fetching user data' });
//   }
// });


// @route   GET api/auth/check-session
// @desc    Check if user's session is valid
// @access  Public
router.get('/check-session', async (req, res) => {
  if (req.isAuthenticated()) {
    const freshUser = await User.findById(req.user._id);
    if (!freshUser) {
      return res.json({
        isAuthenticated: false,
        user: null
      });
    }
    res.json({
      isAuthenticated: true,
      user: freshUser.getPublicProfile()  // ensure this returns full profile
    });
  } else {
    res.json({
      isAuthenticated: false,
      user: null
    });
  }
});


// @route   GET /api/auth/check-registration
// @desc    Validate user's registration step
// @access  Private
router.get('/check-registration', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Assuming registrationStep is stored in the User model
    res.json({ registrationStep: user.registrationStep || 1 });
  } catch (err) {
    console.error('Error during registration check:', err);
    res.status(500).json({ message: 'Error validating registration step' });
  }
});


module.exports = router;

