const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const AdminDashboardController = require('../../controllers/admin/adminDashboardController');

// Dashboard routes
router.get('/summary', authenticateToken, requireAdmin, AdminDashboardController.getDashboardSummary);
router.get('/recent-activity', authenticateToken, requireAdmin, AdminDashboardController.getRecentActivity);
router.get('/top-creators', authenticateToken, requireAdmin, AdminDashboardController.getTopCreators);
router.get('/recent-registrations', authenticateToken, requireAdmin, AdminDashboardController.getRecentRegistrations);

module.exports = router;
