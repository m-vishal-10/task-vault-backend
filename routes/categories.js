const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Get all categories for the authenticated user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', req.user.id)
      .order('name', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ categories: data });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new category
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Check if category already exists for this user
    const { data: existingCategory, error: checkError } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('name', name)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      return res.status(500).json({ error: checkError.message });
    }

    if (existingCategory) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    const { data, error } = await supabase
      .from('categories')
      .insert({
        user_id: req.user.id,
        name: name.trim()
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ category: data });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a category
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
