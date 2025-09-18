const express = require('express');
const router = express.Router();
const LecturerDashboardController = require('../../controllers/lecturer/lecturerDashboardController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');

router.use(authenticateToken);
router.use(requireRoles('lecturer', 'admin', 'sys_admin'));

// Get a summary of key metrics for the lecturer dashboard
router.get('/summary', LecturerDashboardController.getDashboardSummary);

// Get a list of recent and upcoming appointments for the lecturer
router.get('/recent-appointments', LecturerDashboardController.getRecentAppointments);

// Get a list of students the lecturer has recently interacted with
router.get('/recent-students', LecturerDashboardController.getRecentStudents);

module.exports = router;
