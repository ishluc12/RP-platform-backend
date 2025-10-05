/**
 * ML Monitoring Controller
 * Handles requests related to the ML-based monitoring and notification system
 */
const monitoringService = require('../../services/monitoringService');
const mlNotificationService = require('../../services/mlNotificationService');
const { successResponse, errorResponse } = require('../../utils/responseHandlers');

/**
 * Get system health metrics
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getSystemHealth = async (req, res) => {
  try {
    const healthMetrics = monitoringService.getSystemHealth();
    return successResponse(res, 'System health metrics retrieved successfully', healthMetrics);
  } catch (error) {
    monitoringService.trackError(error, { controller: 'mlMonitoringController', method: 'getSystemHealth' });
    return errorResponse(res, 'Failed to retrieve system health metrics', 500);
  }
};

/**
 * Get system anomalies
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getAnomalies = async (req, res) => {
  try {
    const { limit } = req.query;
    const anomalies = monitoringService.getAnomalies(parseInt(limit) || 100);
    return successResponse(res, 'System anomalies retrieved successfully', anomalies);
  } catch (error) {
    monitoringService.trackError(error, { controller: 'mlMonitoringController', method: 'getAnomalies' });
    return errorResponse(res, 'Failed to retrieve system anomalies', 500);
  }
};

/**
 * Get user notifications
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, unreadOnly, types } = req.query;
    
    const options = {
      limit: parseInt(limit) || 50,
      unreadOnly: unreadOnly === 'true',
      types: types ? types.split(',') : null
    };
    
    const notifications = mlNotificationService.getUserNotifications(userId, options);
    return successResponse(res, 'User notifications retrieved successfully', notifications);
  } catch (error) {
    monitoringService.trackError(error, { controller: 'mlMonitoringController', method: 'getUserNotifications' });
    return errorResponse(res, 'Failed to retrieve user notifications', 500);
  }
};

/**
 * Mark notifications as read
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;
    
    if (!notificationIds || !Array.isArray(notificationIds)) {
      return errorResponse(res, 'Notification IDs must be provided as an array', 400);
    }
    
    const count = mlNotificationService.markNotificationsAsRead(userId, notificationIds);
    return successResponse(res, `${count} notifications marked as read`, { count });
  } catch (error) {
    monitoringService.trackError(error, { controller: 'mlMonitoringController', method: 'markNotificationsAsRead' });
    return errorResponse(res, 'Failed to mark notifications as read', 500);
  }
};

/**
 * Update user notification preferences
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const preferences = req.body;
    
    mlNotificationService.updateUserPreferences(userId, preferences);
    return successResponse(res, 'Notification preferences updated successfully', { userId });
  } catch (error) {
    monitoringService.trackError(error, { controller: 'mlMonitoringController', method: 'updateNotificationPreferences' });
    return errorResponse(res, 'Failed to update notification preferences', 500);
  }
};

/**
 * Track user activity for ML learning
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const trackUserActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const { action, data } = req.body;
    
    if (!action) {
      return errorResponse(res, 'Action must be provided', 400);
    }
    
    monitoringService.trackUserActivity(userId, action, data || {});
    mlNotificationService.learnFromUserAction(userId, action, data || {});
    
    return successResponse(res, 'User activity tracked successfully', { userId, action });
  } catch (error) {
    monitoringService.trackError(error, { controller: 'mlMonitoringController', method: 'trackUserActivity' });
    return errorResponse(res, 'Failed to track user activity', 500);
  }
};

module.exports = {
  getSystemHealth,
  getAnomalies,
  getUserNotifications,
  markNotificationsAsRead,
  updateNotificationPreferences,
  trackUserActivity
};