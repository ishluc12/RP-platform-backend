const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const notificationController = require('../../controllers/shared/notificationController');

router.use(authenticateToken);

// Get all notifications for the authenticated user (without pagination)
router.get('/all', notificationController.getAllUserNotifications);

// Get notifications for the authenticated user
router.get('/', notificationController.getUserNotifications);

// Get unread notifications for the authenticated user
router.get('/unread', notificationController.getUnreadNotifications);

// Mark a specific notification as read
router.put('/:id/read', notificationController.markNotificationAsRead);

// Mark all notifications as read for the authenticated user
router.put('/mark-all-read', notificationController.markAllNotificationsAsRead);

module.exports = router;