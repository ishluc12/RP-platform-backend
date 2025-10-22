const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const StudentAppointmentController = require('../../controllers/student/studentAppointmentController');

router.use(authenticateToken);

// Create appointment request
router.post('/', StudentAppointmentController.createAppointment);

// Get student's appointments
router.get('/', StudentAppointmentController.getMyAppointments);

// Get upcoming appointments
router.get('/upcoming', StudentAppointmentController.getUpcomingAppointments);

// Get appointment statistics
router.get('/stats', StudentAppointmentController.getAppointmentStats);

// Get available lecturers for booking
router.get('/available-lecturers', StudentAppointmentController.getAvailableLecturers);

// Get available slots for specific lecturer
router.get('/available-slots-for-lecturer/:staffId', StudentAppointmentController.getAvailableSlotsForLecturer);

// Get appointment history
router.get('/:id/history', StudentAppointmentController.getAppointmentHistory);

// Cancel appointment
router.put('/:id/cancel', StudentAppointmentController.cancelAppointment);

module.exports = router;