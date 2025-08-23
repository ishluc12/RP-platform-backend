const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const Appointment = require('../../models/Appointment');
const Event = require('../../models/Event');

// Require authentication for all dashboard routes
router.use(authenticateToken);

// GET lecturer dashboard
router.get('/', async (req, res) => {
    try {
        const lecturerId = req.user.id;

        // Example: fetch upcoming appointments
        const appointmentsResult = await Appointment.listByLecturer(lecturerId);
        const appointments = appointmentsResult.success ? appointmentsResult.data : [];

        // Example: fetch upcoming events (replace with actual model logic)
        const eventsResult = await Event.listByLecturer(lecturerId);
        const events = eventsResult.success ? eventsResult.data : [];

        // Placeholder statistics
        const stats = {
            totalAppointments: appointments.length,
            totalEvents: events.length,
            upcomingAppointments: appointments.slice(0, 5), // next 5
            upcomingEvents: events.slice(0, 5) // next 5
        };

        res.json({
            success: true,
            message: 'Lecturer dashboard data fetched successfully',
            data: stats
        });
    } catch (error) {
        console.error('Lecturer dashboard error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch dashboard data',
            error: error.message
        });
    }
});

module.exports = router;
