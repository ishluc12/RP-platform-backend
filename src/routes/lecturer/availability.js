const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { supabase } = require('../../config/database');

// All routes require auth
router.use(authenticateToken);

// Create/update availability slots (bulk)
router.post('/', async (req, res) => {
    try {
        const lecturer_id = req.user.id;
        const { slots } = req.body; // [{ available_from, available_to, recurring }]
        if (!Array.isArray(slots) || slots.length === 0) {
            return res.status(400).json({ success: false, message: 'slots array is required' });
        }
        const rows = slots.map(s => ({ lecturer_id, available_from: s.available_from, available_to: s.available_to, recurring: !!s.recurring }));
        const { data, error } = await supabase.from('lecturer_availability').insert(rows).select('*');
        if (error) throw error;
        res.status(201).json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// View own availability
router.get('/', async (req, res) => {
    const { data, error } = await supabase
        .from('lecturer_availability')
        .select('*')
        .eq('lecturer_id', req.user.id)
        .order('available_from', { ascending: true });
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true, data });
});

// Delete a slot
router.delete('/:id', async (req, res) => {
    const { error } = await supabase
        .from('lecturer_availability')
        .delete()
        .match({ id: parseInt(req.params.id), lecturer_id: req.user.id });
    if (error) return res.status(400).json({ success: false, message: error.message });
    res.json({ success: true });
});

module.exports = router;
