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

        if (!lecturer_id || !appointment_time || !reason) {
            return res.status(400).json({ success: false, message: 'lecturer_id, appointment_time, and reason are required' });
        }

        const parsedTime = new Date(appointment_time);
        if (isNaN(parsedTime.getTime())) {
            return res.status(400).json({ success: false, message: 'Invalid appointment_time' });
        }

        const result = await Appointment.create({
            student_id,
            lecturer_id,
            appointment_time: parsedTime,
            reason,
            location,
            meeting_type,
            meeting_link
        });

        if (!result.success) return res.status(400).json({ success: false, message: result.error });

        res.status(201).json({ success: true, data: result.data });
    } catch (error) {
        console.error('Error creating appointment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// List student's appointments
router.get('/', async (req, res) => {
    try {
        const result = await Appointment.listByStudent(req.user.id);
        if (!result.success) return res.status(400).json({ success: false, message: result.error });
        res.json({ success: true, data: result.data });
    } catch (error) {
        console.error('Error fetching appointments:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

// Cancel own appointment
router.delete('/:id', async (req, res) => {
    try {
        const appointmentId = parseInt(req.params.id);
        if (isNaN(appointmentId)) {
            return res.status(400).json({ success: false, message: 'Invalid appointment ID' });
        }

        const result = await Appointment.cancel(appointmentId, req.user.id);
        if (!result.success) return res.status(400).json({ success: false, message: result.error });

        res.json({ success: true, data: result.data });
    } catch (error) {
        console.error('Error canceling appointment:', error);
        res.status(500).json({ success: false, message: error.message });
    }
});

module.exports = router;
