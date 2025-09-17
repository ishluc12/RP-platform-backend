const Comment = require('../../models/Comment');
const { response, errorResponse } = require('../../utils/responseHandlers');

/**
 * Create a new comment on a post.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createComment = async (req, res) => {
    const { postId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    if (!content) {
        return errorResponse(res, 400, 'Comment content is required.');
    }

    try {
        const result = await Comment.create({ post_id: postId, user_id: userId, content });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 201, 'Comment created successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get comments for a specific post.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getCommentsByPost = async (req, res) => {
    const { postId } = req.params;
    const { page, limit } = req.query;

    try {
        const result = await Comment.getCommentsByPost(postId, { page: parseInt(page), limit: parseInt(limit) });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Comments fetched successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Delete a comment.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const deleteComment = async (req, res) => {
    const { commentId } = req.params;
    const userId = req.user.id; // Authenticated user

    try {
        const result = await Comment.delete(commentId, userId);
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Comment deleted successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

module.exports = {
    createComment,
    getCommentsByPost,
    deleteComment
};
