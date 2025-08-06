const { supabase } = require('../config/supabase');

const authenticateUser = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token || token.trim() === '') {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error) {
      console.error('Token verification error:', error.message);
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }
    
    if (!user) {
      return res.status(401).json({ error: 'Authentication required. Please sign in.' });
    }

    // Add user to request object
    req.user = user;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // Continue without user
    }

    const token = authHeader.substring(7);
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (!error && user) {
      req.user = user;
    }
    
    next();
  } catch (error) {
    console.error('Optional auth middleware error:', error);
    next(); // Continue without user
  }
};

module.exports = {
  authenticateUser,
  optionalAuth
}; 