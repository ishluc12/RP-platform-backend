const Post = require('../../models/Post');
const { response, errorResponse } = require('../../utils/responseHandlers');

/**
 * Create a new post.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createPost = async (req, res) => {
    try {
        const user_id = req.user.id;
        const { content, description, image_url, video_url, media_type, sticker } = req.body;
        const result = await Post.create({ user_id, content, description, image_url, video_url, media_type, sticker });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 201, 'Post created successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get a paginated feed of posts (Instagram-style with user details, likes, comments).
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getFeed = async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const currentUserId = req.user?.id; // Get current user ID from auth token
    
    try {
        const result = await Post.feed({ 
            page: parseInt(page), 
            limit: parseInt(limit),
            currentUserId 
        });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Posts fetched successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get a single post by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getPostById = async (req, res) => {
    const { id } = req.params;
    try {
        const result = await Post.getById(id);
        if (!result.success) return errorResponse(res, 404, result.error);
        response(res, 200, 'Post fetched successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Update an existing post.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updatePost = async (req, res) => {
    const { id } = req.params;
    const { content, image_url } = req.body;
    const userId = req.user.id;

    try {
        const result = await Post.update(id, userId, { content, image_url });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Post updated successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Delete a post.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const deletePost = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        const result = await Post.delete(id, userId);
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Post deleted successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Like a post.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const likePost = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;
    try {
        const result = await Post.like({ post_id: postId, user_id: userId });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Post liked successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Unlike a post.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const unlikePost = async (req, res) => {
    const { postId } = req.params;
    const userId = req.user.id;
    try {
        const result = await Post.unlike({ post_id: postId, user_id: userId });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Post unliked successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

module.exports = {
    createPost,
    getFeed,
    getPostById,
    updatePost,
    deletePost,
    likePost,
    unlikePost
};
