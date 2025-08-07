const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');
const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const { supabaseAdmin } = require('../config/supabase');

const router = express.Router();

// User signup
router.post('/signup', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Signup attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    if (error) {
      console.error('Supabase signup error:', error);
      return res.status(400).json({ error: error.message });
    }

    console.log('Signup successful, user:', data.user?.email, 'session exists:', !!data.session);
    
    if (data.user && !data.session) {
      // User created but email confirmation required
      res.status(201).json({
        message: 'Account created successfully. Please check your email to confirm your account before signing in.',
        user: data.user,
        session: null,
        requiresEmailConfirmation: true
      });
    } else {
      // User created and logged in immediately
      res.status(201).json({
        message: 'User created successfully',
        user: data.user,
        session: data.session,
        requiresEmailConfirmation: false
      });
    }
  } catch (error) {
    console.error('Signup error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User signin
router.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log('Signin attempt for email:', email);

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      console.error('Supabase signin error:', error);
      return res.status(401).json({ error: error.message });
    }

    console.log('Signin successful, user:', data.user?.email, 'session exists:', !!data.session);
    
    res.json({
      message: 'Signed in successfully',
      user: data.user,
      session: data.session
    });
  } catch (error) {
    console.error('Signin error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// User signout
router.post('/signout', authenticateUser, async (req, res) => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({ message: 'Signed out successfully' });
  } catch (error) {
    console.error('Signout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user
router.get('/me', authenticateUser, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh session
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({ error: 'Refresh token is required' });
    }

    const { data, error } = await supabase.auth.refreshSession({
      refresh_token,
    });

    if (error) {
      return res.status(400).json({ error: error.message });
    }

    res.json({
      session: data.session
    });
  } catch (error) {
    console.error('Refresh session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Forgot Password - Request Reset Link
router.post('/forgot-password', async (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }
  // Always respond with success to prevent user enumeration
  const genericMsg = 'If an account with that email exists, a password reset link has been sent.';
  try {
    // Find user by email
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.listUsers({ email });
    if (userError || !user || !user.users || user.users.length === 0) {
      return res.json({ message: genericMsg });
    }
    const foundUser = user.users[0];
    // Generate token
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
    // Store in password_resets
    await supabaseAdmin.from('password_resets').insert({
      user_id: foundUser.id,
      email,
      token_hash: tokenHash,
      expires_at: expiresAt.toISOString(),
      used: false
    });
    // Simulate email (log link)
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password?token=${encodeURIComponent(token)}&email=${encodeURIComponent(email)}`;
    console.log(`[Password Reset] Send this link to user: ${resetUrl}`);
    return res.json({ message: genericMsg });
  } catch (err) {
    console.error('Forgot password error:', err);
    return res.json({ message: genericMsg });
  }
});

// Reset Password - Set New Password
router.post('/reset-password', async (req, res) => {
  const { email, token, newPassword } = req.body;
  if (!email || !token || !newPassword) {
    return res.status(400).json({ error: 'Email, token, and new password are required' });
  }
  try {
    // Find latest valid reset token
    const { data: resets, error: resetError } = await supabaseAdmin
      .from('password_resets')
      .select('*')
      .eq('email', email)
      .eq('used', false)
      .order('created_at', { ascending: false })
      .limit(1);
    if (resetError || !resets || resets.length === 0) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    const reset = resets[0];
    if (new Date(reset.expires_at) < new Date()) {
      return res.status(400).json({ error: 'Reset token has expired' });
    }
    // Compare token
    const valid = await bcrypt.compare(token, reset.token_hash);
    if (!valid) {
      return res.status(400).json({ error: 'Invalid or expired reset token' });
    }
    // Update password via Supabase Admin
    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(reset.user_id, { password: newPassword });
    if (updateError) {
      return res.status(500).json({ error: 'Failed to reset password' });
    }
    // Mark token as used
    await supabaseAdmin.from('password_resets').update({ used: true }).eq('id', reset.id);
    return res.json({ message: 'Password has been reset successfully. You can now sign in.' });
  } catch (err) {
    console.error('Reset password error:', err);
    return res.status(500).json({ error: 'Failed to reset password' });
  }
});

module.exports = router; 