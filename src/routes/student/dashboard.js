const express = require('express');
const router = express.Router();
const StudentDashboardController = require('../../controllers/student/studentDashboardController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');

router.use(authenticateToken);
router.use(requireRoles('student', 'admin', 'sys_admin'));

// Get a summary of key metrics for the student dashboard
router.get('/summary', StudentDashboardController.getDashboardSummary);

// Get a list of upcoming events for the student
router.get('/upcoming-events', StudentDashboardController.getUpcomingEvents);

// Get a list of upcoming appointments for the student
router.get('/upcoming-appointments', StudentDashboardController.getUpcomingAppointments);

// Get a list of recent posts by the student
router.get('/recent-posts', StudentDashboardController.getRecentPosts);

module.exports = router;
