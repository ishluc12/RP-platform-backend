const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const AdminAnalyticsController = require('../../controllers/admin/adminAnalyticsController');

// Analytics routes
router.get('/platform-stats', authenticateToken, requireAdmin, AdminAnalyticsController.getOverallPlatformStats);
router.get('/user-growth', authenticateToken, requireAdmin, AdminAnalyticsController.getUserGrowthAnalytics);
router.get('/content-overview', authenticateToken, requireAdmin, AdminAnalyticsController.getContentOverview);
router.get('/appointment-metrics', authenticateToken, requireAdmin, AdminAnalyticsController.getAppointmentMetrics);

module.exports = router;
