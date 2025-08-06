const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

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

module.exports = router; 