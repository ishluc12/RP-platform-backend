const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const StaffAppointmentController = require('../../controllers/staff/staffAppointmentController');
const StaffAvailabilityController = require('../../controllers/staff/staffAvailabilityController');

router.use(authenticateToken);

// =====================================================
// AVAILABILITY MANAGEMENT ROUTES
// =====================================================

// Create availability slot
router.post('/availability', StaffAvailabilityController.createAvailability);

// Get staff's availability
router.get('/availability', StaffAvailabilityController.getMyAvailability);

// Get availability summary
router.get('/availability/summary', StaffAvailabilityController.getAvailabilitySummary);

// Bulk create availability slots
router.post('/availability/bulk', StaffAvailabilityController.bulkCreateAvailability);

// Update availability slot
router.put('/availability/:id', StaffAvailabilityController.updateAvailability);

// Toggle availability active status
router.put('/availability/:id/toggle', StaffAvailabilityController.toggleAvailability);

// Delete availability slot
router.delete('/availability/:id', StaffAvailabilityController.deleteAvailability);

// =====================================================
// AVAILABILITY EXCEPTIONS ROUTES
// =====================================================

// Create availability exception
router.post('/exceptions', StaffAvailabilityController.createException);

// Get availability exceptions
router.get('/exceptions', StaffAvailabilityController.getExceptions);

// Get upcoming exceptions
router.get('/exceptions/upcoming', StaffAvailabilityController.getUpcomingExceptions);

// Update availability exception
router.put('/exceptions/:id', StaffAvailabilityController.updateException);

// Delete availability exception
router.delete('/exceptions/:id', StaffAvailabilityController.deleteException);

// =====================================================
// APPOINTMENT MANAGEMENT ROUTES
// =====================================================

// Get pending appointments
router.get('/pending', StaffAppointmentController.getPendingAppointments);

// Get staff's appointments
router.get('/', StaffAppointmentController.getMyAppointments);

// Get upcoming appointments
router.get('/upcoming', StaffAppointmentController.getUpcomingAppointments);

// Get appointment statistics
router.get('/stats', StaffAppointmentController.getAppointmentStats);

// Get appointment details
router.get('/:id', StaffAppointmentController.getAppointmentDetails);

// Get appointment history
router.get('/:id/history', StaffAppointmentController.getAppointmentHistory);

// Accept appointment
router.put('/:id/accept', StaffAppointmentController.acceptAppointment);

// Decline appointment
router.put('/:id/decline', StaffAppointmentController.declineAppointment);

// Reschedule appointment
router.put('/:id/reschedule', StaffAppointmentController.rescheduleAppointment);

// Complete appointment
router.put('/:id/complete', StaffAppointmentController.completeAppointment);

// Cancel appointment
router.put('/:id/cancel', StaffAppointmentController.cancelAppointment);

module.exports = router;