const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const studentAppointmentController = require('../../controllers/student/studentAppointmentCOntroller.js');

// All routes require auth
router.use(authenticateToken);

// Create appointment
router.post('/', studentAppointmentController.create);

// List student's appointments
router.get('/', studentAppointmentController.list);

// Get upcoming student appointments
router.get('/upcoming', studentAppointmentController.getUpcoming);

// Cancel own appointment
router.delete('/:id', studentAppointmentController.cancel);

module.exports = router;
