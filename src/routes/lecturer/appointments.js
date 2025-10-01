const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const lecturerAppointmentController = require('../../controllers/lecturer/lecturerAppointmentController');
const { requireRoles } = require('../../middleware/roleAuth');

// All routes require authentication and lecturer/admin role
router.use(authenticateToken);

// List lecturer's appointments
router.get('/', requireRoles('lecturer', 'admin', 'administrator', 'sys_admin'), lecturerAppointmentController.list);

// Get upcoming lecturer appointments
router.get('/upcoming', requireRoles('lecturer', 'admin', 'administrator', 'sys_admin'), lecturerAppointmentController.getUpcoming);

// Update appointment status (accept/decline/complete)
router.put('/:id/status', requireRoles('lecturer', 'admin', 'administrator', 'sys_admin'), lecturerAppointmentController.updateStatus);

module.exports = router;
