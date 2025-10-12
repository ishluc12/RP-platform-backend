const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const LecturerAppointmentController = require('../../controllers/lecturer/lecturerAppointmentController');

// Apply authentication to all routes
router.use(authenticateToken);

// Middleware to ensure user is lecturer
function isLecturer(req, res, next) {
    if (req.user && req.user.role === 'lecturer') {
        return next();
    }
    return res.status(403).json({ success: false, message: 'Forbidden: Only lecturers can access this route.' });
}

// Get all pending appointments for lecturer
router.get('/pending', isLecturer, LecturerAppointmentController.getPending);

// List all appointments for lecturer with filters
router.get('/', isLecturer, LecturerAppointmentController.list);

// Get upcoming appointments for lecturer
router.get('/upcoming', isLecturer, LecturerAppointmentController.getUpcoming);

// Update status of an appointment (support both PUT and PATCH)
router.put('/:id/status', isLecturer, LecturerAppointmentController.updateStatus);
router.patch('/:id/status', isLecturer, LecturerAppointmentController.updateStatus);

module.exports = router;