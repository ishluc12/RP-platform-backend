const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const Appointment = require('../../models/Appointment');

// All routes require auth
router.use(authenticateToken);

// Create appointment
router.post('/', async (req, res) => {
    try {
        const student_id = req.user.id;
        const { lecturer_id, appointment_time, reason, location, meeting_type, meeting_link } = req.body;
        const result = await Appointment.create({ student_id, lecturer_id, appointment_time, reason, location, meeting_type, meeting_link });
        if (!result.success) return res.status(400).json({ success: false, message: result.error });
        res.status(201).json({ success: true, data: result.data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// List student's appointments
router.get('/', async (req, res) => {
    const result = await Appointment.listByStudent(req.user.id);
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, data: result.data });
});

// Cancel own appointment
router.delete('/:id', async (req, res) => {
    const result = await Appointment.cancel(parseInt(req.params.id), req.user.id);
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, data: result.data });
});

module.exports = router;
