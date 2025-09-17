const NotificationModel = require('../../models/Notification');
const { response, errorResponse } = require('../../utils/responseHandlers');

/**
 * Get notifications for the authenticated user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getUserNotifications = async (req, res) => {
    const userId = req.user.id;
    const { page, limit } = req.query;

    try {
        const result = await NotificationModel.listForUser(userId, { page: parseInt(page) || 1, limit: parseInt(limit) || 20 });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Notifications fetched successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Mark a specific notification as read.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const markNotificationAsRead = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await NotificationModel.markRead(id, userId);
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Notification marked as read', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Mark all notifications as read for the authenticated user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const markAllNotificationsAsRead = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await NotificationModel.markAllRead(userId);
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'All notifications marked as read', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

module.exports = {
    getUserNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead
};
