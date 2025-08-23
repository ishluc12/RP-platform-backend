const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { supabase } = require('../../config/database');

// All routes require authentication
router.use(authenticateToken);

// Create/update availability slots (bulk)
router.post('/', async (req, res) => {
    try {
        const lecturer_id = req.user.id;
        const { slots } = req.body; // [{ available_from, available_to, recurring }]

        if (!Array.isArray(slots) || slots.length === 0) {
            return res.status(400).json({ success: false, message: 'slots array is required' });
        }

        // Validate each slot
        for (const s of slots) {
            if (!s.available_from || !s.available_to) {
                return res.status(400).json({ success: false, message: 'Each slot must have available_from and available_to' });
            }
        }

        const rows = slots.map(s => ({
            lecturer_id,
            available_from: s.available_from,
            available_to: s.available_to,
            recurring: !!s.recurring
        }));

        const { data, error } = await supabase.from('lecturer_availability').insert(rows).select('*');
        if (error) throw error;

        res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error creating availability slots:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// View own availability
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('lecturer_availability')
            .select('*')
            .eq('lecturer_id', req.user.id)
            .order('available_from', { ascending: true });

        if (error) throw error;

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching availability:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// Delete a slot
router.delete('/:id', async (req, res) => {
    try {
        const slotId = parseInt(req.params.id);
        if (isNaN(slotId)) {
            return res.status(400).json({ success: false, message: 'Invalid slot ID' });
        }

        const { data, error } = await supabase
            .from('lecturer_availability')
            .delete()
            .eq('id', slotId)
            .eq('lecturer_id', req.user.id)
            .select('*');

        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: 'Slot not found or not authorized' });
        }

        res.json({ success: true, message: 'Slot deleted successfully', data });
    } catch (error) {
        console.error('Error deleting slot:', error);
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;
