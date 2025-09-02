const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const lecturerAppointmentController = require('../../controllers/lecturer/lecturerAppointmentController');

// All routes require authentication
router.use(authenticateToken);

// List lecturer's appointments
router.get('/', lecturerAppointmentController.list);

// Get upcoming lecturer appointments
router.get('/upcoming', lecturerAppointmentController.getUpcoming);

// Update appointment status (accept/decline/complete)
router.put('/:id/status', lecturerAppointmentController.updateStatus);

module.exports = router;
