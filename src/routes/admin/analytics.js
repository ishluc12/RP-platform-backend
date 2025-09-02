const express = require('express');
const router = express.Router();
const AdminAnalyticsController = require('../../controllers/admin/adminAnalyticsController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleAuth');

router.use(authenticateToken);
router.use(requireRole(['admin', 'sys_admin']));

// Get overall platform statistics
router.get('/platform-stats', AdminAnalyticsController.getOverallPlatformStats);

// Get user growth analytics
router.get('/user-growth', AdminAnalyticsController.getUserGrowthAnalytics);

// Get content overview (posts, forums, polls)
router.get('/content-overview', AdminAnalyticsController.getContentOverview);

// Get appointment metrics
router.get('/appointment-metrics', AdminAnalyticsController.getAppointmentMetrics);

module.exports = router;
