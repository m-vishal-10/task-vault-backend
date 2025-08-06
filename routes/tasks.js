const express = require('express');
const { supabase } = require('../config/supabase');
const { authenticateUser } = require('../middleware/auth');

const router = express.Router();

// Get all tasks for the authenticated user
router.get('/', authenticateUser, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ tasks: data });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get a single task by ID
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', id)
      .eq('user_id', req.user.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Task not found' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ task: data });
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create a new task
router.post('/', authenticateUser, async (req, res) => {
  try {
    const { title, description, status, priority, due_date, category } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const { data, error } = await supabase
      .from('tasks')
      .insert({
        user_id: req.user.id,
        title,
        description,
        status: status || 'pending',
        priority: priority || 'medium',
        due_date: due_date ? new Date(due_date).toISOString() : null,
        category
      })
      .select()
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.status(201).json({ task: data });
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update a task
router.put('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, priority, due_date, category } = req.body;

    const updateData = {
      updated_at: new Date().toISOString()
    };

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (due_date !== undefined) {
      updateData.due_date = due_date ? new Date(due_date).toISOString() : null;
    }
    if (category !== undefined) updateData.category = category;

    const { data, error } = await supabase
      .from('tasks')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', req.user.id)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: 'Task not found' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ task: data });
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete a task
router.delete('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', req.user.id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tasks by status
router.get('/status/:status', authenticateUser, async (req, res) => {
  try {
    const { status } = req.params;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('status', status)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ tasks: data });
  } catch (error) {
    console.error('Get tasks by status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tasks by priority
router.get('/priority/:priority', authenticateUser, async (req, res) => {
  try {
    const { priority } = req.params;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('priority', priority)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ tasks: data });
  } catch (error) {
    console.error('Get tasks by priority error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get tasks by category
router.get('/category/:category', authenticateUser, async (req, res) => {
  try {
    const { category } = req.params;

    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('user_id', req.user.id)
      .eq('category', category)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ tasks: data });
  } catch (error) {
    console.error('Get tasks by category error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;
