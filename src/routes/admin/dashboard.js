const express = require('express');
const router = express.Router();
const AdminDashboardController = require('../../controllers/admin/adminDashboardController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleAuth');

router.use(authenticateToken);
router.use(requireRole(['admin', 'sys_admin']));

// Get a summary of key metrics for the admin dashboard
router.get('/summary', AdminDashboardController.getDashboardSummary);

// Get a list of recent activities across the platform
router.get('/recent-activity', AdminDashboardController.getRecentActivity);

// Get top creators (users with most content)
router.get('/top-creators', AdminDashboardController.getTopCreators);

// Get a list of recently registered users
router.get('/recent-registrations', AdminDashboardController.getRecentRegistrations);

module.exports = router;
