const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { supabase } = require('../../config/database');

router.use(authenticateToken);

// List forums
router.get('/', async (req, res) => {
    const { data, error } = await supabase.from('forums').select('*').order('created_at', { ascending: false });
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, data });
});

// Create forum
router.post('/', async (req, res) => {
    const { title, description } = req.body;
    const { data, error } = await supabase.from('forums').insert([{ title, description, created_by: req.user.id }]).select('*').single();
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.status(201).json({ success: true, data });
});

// Add post to forum
router.post('/:forum_id/posts', async (req, res) => {
    const forum_id = parseInt(req.params.forum_id);
    const { content } = req.body;
    const { data, error } = await supabase.from('forum_posts').insert([{ forum_id, user_id: req.user.id, content }]).select('*').single();
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.status(201).json({ success: true, data });
});

module.exports = router;
