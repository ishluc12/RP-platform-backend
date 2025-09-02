const Forum = require('../../models/Forum');
const ForumPost = require('../../models/ForumPost');
const { response, errorResponse } = require('../../utils/responseHandlers');

// --- Forum Controllers ---

/**
 * Create a new forum.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createForum = async (req, res) => {
    const { title, description } = req.body;
    const created_by = req.user.id;

    if (!title) {
        return errorResponse(res, 400, 'Forum title is required.');
    }

    try {
        const result = await Forum.create({ title, description, created_by });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 201, 'Forum created successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get all forums.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getAllForums = async (req, res) => {
    const { page, limit } = req.query;

    try {
        const result = await Forum.getAll({ page: parseInt(page), limit: parseInt(limit) });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Forums fetched successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get a forum by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getForumById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Forum.getById(parseInt(id));
        if (!result.success) return errorResponse(res, 404, result.error);
        response(res, 200, 'Forum fetched successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Update a forum.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateForum = async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;
    const userId = req.user.id;

    try {
        const result = await Forum.update(parseInt(id), userId, { title, description });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Forum updated successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Delete a forum.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const deleteForum = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await Forum.delete(parseInt(id), userId);
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Forum deleted successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

// --- Forum Post Controllers ---

/**
 * Create a new post in a forum.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createForumPost = async (req, res) => {
    const { forumId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
        return errorResponse(res, 400, 'Post content is required.');
    }

    try {
        const result = await ForumPost.create({ forum_id: parseInt(forumId), user_id: userId, content });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 201, 'Forum post created successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get posts for a specific forum.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getForumPostsByForum = async (req, res) => {
    const { forumId } = req.params;
    const { page, limit } = req.query;

    try {
        const result = await ForumPost.getPostsByForum(parseInt(forumId), { page: parseInt(page), limit: parseInt(limit) });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Forum posts fetched successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get a single forum post by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getForumPostById = async (req, res) => {
    const { postId } = req.params;

    try {
        const result = await ForumPost.getById(parseInt(postId));
        if (!result.success) return errorResponse(res, 404, result.error);
        response(res, 200, 'Forum post fetched successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Update a forum post.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateForumPost = async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    try {
        const result = await ForumPost.update(parseInt(postId), userId, { content });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Forum post updated successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Delete a forum post.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const deleteForumPost = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;

    try {
        const result = await ForumPost.delete(parseInt(postId), userId);
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Forum post deleted successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

module.exports = {
    createForum,
    getAllForums,
    getForumById,
    updateForum,
    deleteForum,
    createForumPost,
    getForumPostsByForum,
    getForumPostById,
    updateForumPost,
    deleteForumPost
};
