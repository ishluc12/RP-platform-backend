const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');
const administratorAppointmentController = require('../../controllers/administrator/administratorAppointmentController');

// All routes require authentication
router.use(authenticateToken);

// Get all appointments for the authenticated administrator
router.get('/', requireRoles('administrator', 'admin', 'sys_admin'), administratorAppointmentController.list);

// Get upcoming appointments for the authenticated administrator
router.get('/upcoming', requireRoles('administrator', 'admin', 'sys_admin'), administratorAppointmentController.getUpcoming);

// Update appointment status (accept/decline/complete/cancel)
router.put('/:id/status', requireRoles('administrator', 'admin', 'sys_admin'), administratorAppointmentController.updateStatus);

module.exports = router;
