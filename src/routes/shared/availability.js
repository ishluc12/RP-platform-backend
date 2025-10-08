const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireStudentOrAdmin } = require('../../middleware/roleAuth');
const { pgPool } = require('../../config/database');

// Students can view a staff member's availability by staff ID (includes both lecturers and administrators)
router.use(authenticateToken);
router.use(requireStudentOrAdmin);

// GET /api/shared/availability/:staffId
router.get('/:staffId', async (req, res) => {
    try {
        const staffId = req.params.staffId;
        if (!staffId) {
            return res.status(400).json({ success: false, message: 'Invalid staff ID' });
        }

        const { day_of_week, active, availability_type } = req.query;

        // Build query dynamically
        let query = `SELECT * FROM staff_availability WHERE staff_id = $1`;
        const params = [staffId];
        let paramIndex = 2;

        if (active !== undefined) {
            query += ` AND is_active = $${paramIndex}`;
            params.push(active === 'true');
            paramIndex++;
        }

        if (day_of_week) {
            const dayNum = parseInt(day_of_week, 10);
            if (!isNaN(dayNum)) {
                // Support both schemas: 0..6 (Sun..Sat) and 1..7 (Mon..Sun or Sun..Sat)
                const candidates = [];
                if (dayNum >= 0 && dayNum <= 6) {
                    candidates.push(dayNum);
                }
                if (dayNum >= 1 && dayNum <= 7) {
                    const normalized = dayNum === 7 ? 0 : dayNum; // Map 7->0 for Sunday
                    if (!candidates.includes(normalized)) candidates.push(normalized);
                }
                if (candidates.length > 0) {
                    query += ` AND day_of_week = ANY($${paramIndex})`;
                    params.push(candidates);
                    paramIndex++;
                }
            }
        }

        if (availability_type) {
            query += ` AND availability_type = $${paramIndex}`;
            params.push(String(availability_type));
            paramIndex++;
        }

        query += ` ORDER BY day_of_week ASC, start_time ASC`;

        const result = await pgPool.query(query, params);

        return res.json({ success: true, data: result.rows });
    } catch (error) {
        console.error('Error fetching staff availability:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

module.exports = router;