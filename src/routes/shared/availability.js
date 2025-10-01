const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireStudentOrAdmin } = require('../../middleware/roleAuth');
const { pgPool } = require('../../config/database');

// Students can view a lecturer's availability by lecturer ID
router.use(authenticateToken);
router.use(requireStudentOrAdmin);

// GET /api/shared/availability/:lecturerId
router.get('/:staffId', async (req, res) => {
    try {
        const staffId = req.params.staffId;
        if (!staffId) {
            return res.status(400).json({ success: false, message: 'Invalid staff ID' });
        }

        // Use PostgreSQL pool directly instead of Supabase client
        const query = `
            SELECT * FROM staff_availability 
            WHERE staff_id = $1 
            ORDER BY day_of_week ASC
        `;
        
        const result = await pgPool.query(query, [staffId]);

        return res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching lecturer availability:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;