const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const adminAppointmentController = require('../../controllers/admin/adminAppointmentController');
const SafeAdminController = require('../../controllers/admin/safeAdminController');

// Apply auth middleware to all admin appointment routes
router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/appointments - Get all appointments with filters
router.get('/', adminAppointmentController.getAllAppointments);
router.get('/safe', SafeAdminController.getAppointmentsList);

// GET /api/admin/appointments/stats - Get appointment statistics
router.get('/stats', adminAppointmentController.getAppointmentStats);

// GET /api/admin/appointments/search - Search appointments
router.get('/search', adminAppointmentController.searchAppointments);

// GET /api/admin/appointments/:id - Get appointment by ID
router.get('/:id', adminAppointmentController.getAppointmentById);

// PUT /api/admin/appointments/:id/status - Update appointment status
router.put('/:id/status', adminAppointmentController.updateAppointmentStatus);

// DELETE /api/admin/appointments/:id - Delete appointment
router.delete('/:id', adminAppointmentController.deleteAppointment);

module.exports = router;