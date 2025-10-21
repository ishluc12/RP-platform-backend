const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');
const administratorAppointmentController = require('../../controllers/administrator/administratorAppointmentController');

const ADMIN_ROLES = ['administrator', 'admin', 'sys_admin'];

// All routes require authentication
router.use(authenticateToken);

// Get all appointments
router.get('/', requireRoles(...ADMIN_ROLES), administratorAppointmentController.list);

// Get upcoming appointments
router.get('/upcoming', requireRoles(...ADMIN_ROLES), administratorAppointmentController.getUpcoming);

// Get appointment history
router.get('/:id/history', requireRoles(...ADMIN_ROLES), administratorAppointmentController.getAppointmentHistory);

// Accept appointment
router.put('/:id/accept', requireRoles(...ADMIN_ROLES), administratorAppointmentController.acceptAppointment);

// Decline appointment
router.put('/:id/decline', requireRoles(...ADMIN_ROLES), administratorAppointmentController.declineAppointment);

// Complete appointment
router.put('/:id/complete', requireRoles(...ADMIN_ROLES), administratorAppointmentController.completeAppointment);

// Update appointment status
router.put('/:id/status', requireRoles(...ADMIN_ROLES), administratorAppointmentController.updateStatus);

module.exports = router;