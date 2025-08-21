const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const Appointment = require('../../models/Appointment');

// All routes require auth
router.use(authenticateToken);

// List lecturer's appointments
router.get('/', async (req, res) => {
    const result = await Appointment.listByLecturer(req.user.id);
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, data: result.data });
});

// Update appointment status (accept/decline/complete)
router.put('/:id/status', async (req, res) => {
    const { status } = req.body; // 'accepted' | 'declined' | 'completed'
    if (!['accepted', 'declined', 'completed'].includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
    }
    const apptId = parseInt(req.params.id);
    const result = await Appointment.update(apptId, { status });
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, data: result.data });
});

module.exports = router;
