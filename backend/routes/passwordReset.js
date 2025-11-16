const express = require('express');
const User = require('../models/User');
const PasswordReset = require('../models/PasswordReset');
const auth = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/password-reset/forgot
// @desc    Request password reset
// @access  Public
router.post('/forgot', async (req, res) => {
  try {
    const { email } = req.body;

    // Validation
    if (!email) {
      return res.status(400).json({ error: 'Email is required' });
    }

    // Email format validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email format' });
    }

    // Sanitize email
    const sanitizedEmail = email.toLowerCase().trim();

    // Find user by email
    const user = await User.findOne({ email: sanitizedEmail });
    
    // Always return success (security: don't reveal if email exists)
    if (!user) {
      return res.json({
        message: 'If an account with that email exists, a password reset link has been sent.',
      });
    }

    // Generate reset token
    const token = PasswordReset.generateToken();

    // Create password reset record
    const passwordReset = new PasswordReset({
      userId: user._id,
      token,
      expiresAt: new Date(Date.now() + 3600000), // 1 hour
    });

    await passwordReset.save();

    // In production, send email here with reset link
    // For development, return the reset link in response
    const resetLink = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${token}`;

    res.json({
      message: 'If an account with that email exists, a password reset link has been sent.',
      // Only return reset link in development mode
      resetLink: process.env.NODE_ENV === 'development' ? resetLink : undefined,
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Server error processing password reset request' });
  }
});

// @route   POST /api/password-reset/verify
// @desc    Verify reset token
// @access  Public
router.post('/verify', async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: 'Token is required' });
    }

    // Find valid token
    const passwordReset = await PasswordReset.findValidToken(token);

    if (!passwordReset) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Get user info (without password)
    const user = await User.findById(passwordReset.userId).select('-passwordHash');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      valid: true,
      email: user.email,
    });
  } catch (error) {
    console.error('Verify token error:', error);
    res.status(500).json({ error: 'Server error verifying token' });
  }
});

// @route   POST /api/password-reset/reset
// @desc    Reset password with token
// @access  Public
router.post('/reset', async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    // Validation
    if (!token || !newPassword) {
      return res.status(400).json({ error: 'Token and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters' });
    }

    // Find valid token
    const passwordReset = await PasswordReset.findValidToken(token);

    if (!passwordReset) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }

    // Find user
    const user = await User.findById(passwordReset.userId);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Update password (will be hashed by pre-save hook)
    user.passwordHash = newPassword;
    await user.save();

    // Mark token as used
    passwordReset.used = true;
    passwordReset.usedAt = new Date();
    await passwordReset.save();

    res.json({
      message: 'Password reset successfully. You can now sign in with your new password.',
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Server error resetting password' });
  }
});

// @route   POST /api/password-reset/change
// @desc    Change password (for authenticated users)
// @access  Private
router.post('/change', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Validation
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Current password and new password are required' });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({ error: 'New password must be at least 8 characters' });
    }

    // Get user with password hash
    const user = await User.findById(req.user._id);

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Update password (will be hashed by pre-save hook)
    user.passwordHash = newPassword;
    await user.save();

    res.json({
      message: 'Password changed successfully',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Server error changing password' });
  }
});

module.exports = router;

