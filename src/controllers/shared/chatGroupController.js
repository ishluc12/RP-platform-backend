const ChatGroup = require('../../models/ChatGroup');
const { response, errorResponse } = require('../../utils/responseHandlers');

// --- Chat Group Management ---

/**
 * Create a new chat group.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createChatGroup = async (req, res) => {
    const { name, initial_members } = req.body;
    const created_by = req.user.id;

    if (!name) {
        return errorResponse(res, 400, 'Chat group name is required.');
    }

    try {
        const result = await ChatGroup.create({ name, created_by, initial_members });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 201, 'Chat group created successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get a chat group by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getChatGroupById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await ChatGroup.getById(parseInt(id));
        if (!result.success) return errorResponse(res, result.error === 'Chat group not found' ? 404 : 400, result.error);
        response(res, 200, 'Chat group fetched successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Update a chat group's details.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateChatGroup = async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user.id;

    try {
        const result = await ChatGroup.update(parseInt(id), userId, { name });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Chat group updated successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Delete a chat group.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const deleteChatGroup = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await ChatGroup.delete(parseInt(id), userId);
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Chat group deleted successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

// --- Chat Group Member Management ---

/**
 * Add a member to a chat group.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const addGroupMember = async (req, res) => {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!userId) {
        return errorResponse(res, 400, 'User ID to add is required.');
    }

    try {
        const result = await ChatGroup.addMember(parseInt(groupId), parseInt(userId));
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Member added to group successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Remove a member from a chat group.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const removeGroupMember = async (req, res) => {
    const { groupId, userId } = req.params;

    try {
        const result = await ChatGroup.removeMember(parseInt(groupId), parseInt(userId));
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Member removed from group successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

module.exports = {
    createChatGroup,
    getChatGroupById,
    updateChatGroup,
    deleteChatGroup,
    addGroupMember,
    removeGroupMember
};
