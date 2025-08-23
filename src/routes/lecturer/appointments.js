const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const Appointment = require('../../models/Appointment');

// All routes require authentication
router.use(authenticateToken);

// List lecturer's appointments
router.get('/', async (req, res) => {
    try {
        const result = await Appointment.listByLecturer(req.user.id);
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.error });
        }
        res.json({ success: true, data: result.data });
    } catch (err) {
        console.error('Error fetching appointments:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

// Update appointment status (accept/decline/complete)
router.put('/:id/status', async (req, res) => {
    try {
        const { status } = req.body; // 'accepted' | 'declined' | 'completed'
        if (!['accepted', 'declined', 'completed'].includes(status)) {
            return res.status(400).json({ success: false, message: 'Invalid status' });
        }

        const apptId = parseInt(req.params.id);
        if (isNaN(apptId)) {
            return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
        }

        const result = await Appointment.update(apptId, { status });
        if (!result.success) {
            return res.status(400).json({ success: false, message: result.error });
        }

        res.json({ success: true, data: result.data });
    } catch (err) {
        console.error('Error updating appointment status:', err);
        res.status(500).json({ success: false, message: 'Server error', error: err.message });
    }
});

module.exports = router;
