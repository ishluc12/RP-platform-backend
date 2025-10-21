const NotificationModel = require('../../models/Notification');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

/**
 * Get all notifications for the authenticated user (without pagination).
 */
const getAllUserNotifications = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await NotificationModel.listAllForUser(userId);

        if (!result.success) {
            return errorResponse(res, 400, result.error);
        }

        response(res, 200, 'All notifications fetched successfully', result.data);
    } catch (error) {
        logger.error('Error fetching all notifications:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

/**
 * Get notifications for the authenticated user.
 */
const getUserNotifications = async (req, res) => {
    const userId = req.user.id;
    const { page, limit } = req.query;

    try {
        const result = await NotificationModel.listForUser(userId, {
            page: parseInt(page) || 1,
            limit: parseInt(limit) || 20
        });

        if (!result.success) {
            return errorResponse(res, 400, result.error);
        }

        response(res, 200, 'Notifications fetched successfully', result.data);
    } catch (error) {
        logger.error('Error fetching notifications:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

/**
 * Get unread notifications for the authenticated user.
 */
const getUnreadNotifications = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await NotificationModel.listUnreadForUser(userId);

        if (!result.success) {
            return errorResponse(res, 400, result.error);
        }

        response(res, 200, 'Unread notifications fetched successfully', result.data);
    } catch (error) {
        logger.error('Error fetching unread notifications:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

/**
 * Mark a specific notification as read.
 */
const markNotificationAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await NotificationModel.markRead(id, userId);

        if (!result.success) {
            return errorResponse(res, 400, result.error);
        }

        response(res, 200, 'Notification marked as read', result.data);
    } catch (error) {
        logger.error('Error marking notification as read:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

/**
 * Mark all notifications as read for the authenticated user.
 */
const markAllNotificationsAsRead = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await NotificationModel.markAllRead(userId);

        if (!result.success) {
            return errorResponse(res, 400, result.error);
        }

        response(res, 200, 'All notifications marked as read', result.data);
    } catch (error) {
        logger.error('Error marking all notifications as read:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

module.exports = {
    getAllUserNotifications,
    getUserNotifications,
    getUnreadNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};