const Message = require('../../models/Message');
const { response, errorResponse } = require('../../utils/responseHandlers');

/**
 * Get messages for a specific group chat.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getGroupMessages = async (req, res) => {
    const { groupId } = req.params;
    const { page, limit } = req.query;
    const userId = req.user.id; // Assuming user is authenticated and userId is available

    try {
        // In a real application, you'd also check if the user is a member of this group
        const result = await Message.getGroupMessages(parseInt(groupId), { page, limit });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Group messages fetched successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get a list of all direct message conversations for the authenticated user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getUserConversations = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await Message.getUserConversations(userId);
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'User conversations fetched successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get a list of all group chats the authenticated user is a member of.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getUserGroupChats = async (req, res) => {
    const userId = req.user.id;

    try {
        const result = await Message.getUserGroupChats(userId);
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'User group chats fetched successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

module.exports = {
    getGroupMessages,
    getUserConversations,
    getUserGroupChats
};
