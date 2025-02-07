const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { ensureAuthenticated, ensureAdmin } = require('../middleware/passportMiddleware');

// @route   GET /api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', ensureAuthenticated, async (req, res) => {
  try {
    console.log('Profile request received for user:', req.user.id);
    
    // User is already attached by Passport
    if (!req.user) {
      console.log('User not found in request');
      return res.status(404).json({ message: 'User not found' });
    }
    
    res.json(req.user.getPublicProfile());
  } catch (error) {
    console.error('Error fetching profile:', error);
    res.status(500).json({ message: 'Error fetching profile' });
  }
});

// @route   PUT /api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', ensureAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Different profile updates based on account type
    if (user.accountType === 'PROVIDER') {
      // Update provider profile
      user.providerProfile = {
        ...user.providerProfile,
        ...req.body.providerProfile
      };
      
      // Update basic profile fields
      if (req.body.profile) {
        user.profile = {
          ...user.profile,
          ...req.body.profile
        };
      }
    } else {
      // Client profile updates
      user.profile = {
        ...user.profile,
        ...req.body
      };
    }

    if (req.body.registrationStep) {
      user.registrationStep = req.body.registrationStep;
    }

    await user.save();
    res.json({ 
      message: 'Profile updated successfully', 
      user: user.getPublicProfile() 
    });
  } catch (error) {
    console.error('Error updating profile:', error);
    res.status(500).json({ message: 'Error updating profile' });
  }
});

// Get provider's clients
router.get('/provider/clients', ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.accountType !== 'PROVIDER') {
      return res.status(403).json({ message: 'Provider access required' });
    }

    const clients = await User.find({ 
      providerId: req.user._id,
      accountType: 'CLIENT'
    }).select('-password');

    res.json(clients);
  } catch (error) {
    console.error('Error fetching clients:', error);
    res.status(500).json({ message: 'Error fetching clients' });
  }
});

// Invite client
router.post('/provider/invite', ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.accountType !== 'PROVIDER') {
      return res.status(403).json({ message: 'Provider access required' });
    }

    const { email } = req.body;
    
    // Check if user already exists
    let client = await User.findByEmail(email);
    if (client) {
      return res.status(400).json({ 
        message: 'Email already registered' 
      });
    }

    // Create invitation token
    const inviteToken = crypto.randomBytes(32).toString('hex');
    
    // Store invitation
    const invitation = new Invitation({
      email,
      provider: req.user._id,
      token: inviteToken,
      expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
    });

    await invitation.save();

    // Send invitation email (implement email service)
    
    res.status(200).json({ 
      message: 'Invitation sent successfully' 
    });
  } catch (error) {
    console.error('Error sending invitation:', error);
    res.status(500).json({ message: 'Error sending invitation' });
  }
});

// Remove client from provider
router.delete('/provider/clients/:clientId', ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.accountType !== 'PROVIDER') {
      return res.status(403).json({ message: 'Provider access required' });
    }

    const client = await User.findOne({
      _id: req.params.clientId,
      providerId: req.user._id
    });

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Remove provider association
    client.providerId = null;
    await client.save();

    res.json({ message: 'Client removed successfully' });
  } catch (error) {
    console.error('Error removing client:', error);
    res.status(500).json({ message: 'Error removing client' });
  }
});

// Update provider profile settings
router.put('/provider/settings', ensureAuthenticated, async (req, res) => {
  try {
    if (req.user.accountType !== 'PROVIDER') {
      return res.status(403).json({ message: 'Provider access required' });
    }

    const user = await User.findById(req.user._id);
    
    user.providerProfile = {
      ...user.providerProfile,
      ...req.body.settings
    };

    await user.save();
    res.json({
      message: 'Provider settings updated',
      settings: user.providerProfile
    });
  } catch (error) {
    console.error('Error updating provider settings:', error);
    res.status(500).json({ message: 'Error updating settings' });
  }
});

// Get provider public profile
router.get('/provider/:providerId/profile', async (req, res) => {
  try {
    const provider = await User.findOne({
      _id: req.params.providerId,
      accountType: 'PROVIDER'
    }).select('providerProfile email');

    if (!provider) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json({
      providerId: provider._id,
      businessName: provider.providerProfile.businessName,
      email: provider.email
    });
  } catch (error) {
    console.error('Error fetching provider profile:', error);
    res.status(500).json({ message: 'Error fetching provider profile' });
  }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Admin
router.get('/:id', ensureAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json(user.getPublicProfile());
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ message: 'Error fetching user' });
  }
});

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Admin
router.get('/', ensureAdmin, async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ message: 'Error fetching users' });
  }
});

router.put('/treatment-preferences', ensureAuthenticated, async (req, res) => {
  try {
    console.log('Treatment preferences update request received:', req.body);

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      {
        $set: {
          'profile.treatmentPreferences': req.body.preferences,
          registrationStep: 3  // Update to final step
        }
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ 
      message: 'Treatment preferences updated successfully',
      user: updatedUser.getPublicProfile()
    });
  } catch (error) {
    console.error('Error updating treatment preferences:', error);
    res.status(500).json({ message: 'Error updating treatment preferences' });
  }
});

module.exports = router;
