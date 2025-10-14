/**
 * ML Monitoring Routes
 */
const express = require('express');
const router = express.Router();
const mlMonitoringController = require('../../controllers/shared/mlMonitoringController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');

// Get system health metrics (admin only)
router.get('/health', authenticateToken, requireRoles('admin', 'administrator', 'sys_admin'), mlMonitoringController.getSystemHealth);

// Get system anomalies (admin only)
router.get('/anomalies', authenticateToken, requireRoles('admin', 'administrator', 'sys_admin'), mlMonitoringController.getAnomalies);

// Get user notifications (all authenticated users)
router.get('/notifications', authenticateToken, mlMonitoringController.getUserNotifications);

// Mark notifications as read (all authenticated users)
router.post('/notifications/read', authenticateToken, mlMonitoringController.markNotificationsAsRead);

// Update notification preferences (all authenticated users)
router.put('/preferences', authenticateToken, mlMonitoringController.updateNotificationPreferences);

// Track user activity for ML learning (all authenticated users)
router.post('/track-activity', authenticateToken, mlMonitoringController.trackUserActivity);

module.exports = router;