const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireStudentOrAdmin } = require('../../middleware/roleAuth');
const { supabase } = require('../../config/database');

// Students can view a lecturer's availability by lecturer ID
router.use(authenticateToken);
router.use(requireStudentOrAdmin());

// GET /api/shared/availability/:lecturerId
router.get('/:lecturerId', async (req, res) => {
    try {
        const lecturerId = Number(req.params.lecturerId);
        if (Number.isNaN(lecturerId)) {
            return res.status(400).json({ success: false, message: 'Invalid lecturer ID' });
        }

        const { data, error } = await supabase
            .from('lecturer_availability')
            .select('*')
            .eq('lecturer_id', lecturerId)
            .order('available_from', { ascending: true });

        if (error) throw error;

        return res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching lecturer availability:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;


