const Forum = require('../../models/Forum');
const ForumPost = require('../../models/ForumPost');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class AdminForumController {
    // --- Forum Management ---

    static async getAllForums(req, res) {
        const { page, limit, title, created_by } = req.query;
        const filters = {};
        if (title) filters.title = title;
        if (created_by) filters.created_by = created_by;

        try {
            const result = await Forum.getAll({ ...filters, page: parseInt(page) || 1, limit: parseInt(limit) || 10 });
            if (!result.success) {
                logger.error('Error fetching all forums (admin):', result.error);
                return errorResponse(res, 500, 'Failed to fetch forums', result.error);
            }
            response(res, 200, 'Forums fetched successfully', result.data, result.pagination);
        } catch (error) {
            logger.error('Exception in admin getAllForums:', error.message);
            errorResponse(res, 500, error.message);
        }
    }

    static async getForumById(req, res) {
        const { id } = req.params;
        try {
            const result = await Forum.getById(id);
            if (!result.success) {
                logger.error('Error fetching forum by ID (admin):', result.error);
                return errorResponse(res, result.error === 'Forum not found' ? 404 : 500, result.error);
            }
            response(res, 200, 'Forum fetched successfully', result.data);
        } catch (error) {
            logger.error('Exception in admin getForumById:', error.message);
            errorResponse(res, 500, error.message);
        }
    }

    static async updateForum(req, res) {
        const { id } = req.params;
        const updates = req.body;
        try {
            // Admin can update any forum, so pass null for userId for authorization check bypass in model
            const result = await Forum.update(id, null, updates);
            if (!result.success) {
                logger.error('Error updating forum (admin):', result.error);
                return errorResponse(res, result.error === 'Forum not found or unauthorized to update' ? 404 : 500, result.error);
            }
            response(res, 200, 'Forum updated successfully', result.data);
        } catch (error) {
            logger.error('Exception in admin updateForum:', error.message);
            errorResponse(res, 500, error.message);
        }
    }

    static async deleteForum(req, res) {
        const { id } = req.params;
        try {
            // Admin can delete any forum, so pass null for userId for authorization check bypass in model
            const result = await Forum.delete(id, null);
            if (!result.success) {
                logger.error('Error deleting forum (admin):', result.error);
                return errorResponse(res, result.error === 'Forum not found or unauthorized to delete' ? 404 : 500, result.error);
            }
            response(res, 200, 'Forum deleted successfully', result.data);
        } catch (error) {
            logger.error('Exception in admin deleteForum:', error.message);
            errorResponse(res, 500, error.message);
        }
    }

    // --- Forum Post Management ---

    static async getForumPostsByForum(req, res) {
        const { forumId } = req.params;
        const { page, limit } = req.query;
        try {
            const result = await ForumPost.getPostsByForum(forumId, { page: parseInt(page) || 1, limit: parseInt(limit) || 10 });
            if (!result.success) {
                logger.error('Error fetching forum posts by forum (admin):', result.error);
                return errorResponse(res, 500, 'Failed to fetch forum posts', result.error);
            }
            response(res, 200, 'Forum posts fetched successfully', result.data);
        } catch (error) {
            logger.error('Exception in admin getForumPostsByForum:', error.message);
            errorResponse(res, 500, error.message);
        }
    }

    static async getForumPostById(req, res) {
        const { postId } = req.params;
        try {
            const result = await ForumPost.getById(postId);
            if (!result.success) {
                logger.error('Error fetching forum post by ID (admin):', result.error);
                return errorResponse(res, result.error === 'Forum post not found' ? 404 : 500, result.error);
            }
            response(res, 200, 'Forum post fetched successfully', result.data);
        } catch (error) {
            logger.error('Exception in admin getForumPostById:', error.message);
            errorResponse(res, 500, error.message);
        }
    }

    static async updateForumPost(req, res) {
        const { postId } = req.params;
        const updates = req.body;
        try {
            // Admin can update any forum post, so pass null for userId for authorization check bypass in model
            const result = await ForumPost.update(postId, null, updates);
            if (!result.success) {
                logger.error('Error updating forum post (admin):', result.error);
                return errorResponse(res, result.error === 'Forum post not found or unauthorized to update' ? 404 : 500, result.error);
            }
            response(res, 200, 'Forum post updated successfully', result.data);
        } catch (error) {
            logger.error('Exception in admin updateForumPost:', error.message);
            errorResponse(res, 500, error.message);
        }
    }

    static async deleteForumPost(req, res) {
        const { postId } = req.params;
        try {
            // Admin can delete any forum post, so pass null for userId for authorization check bypass in model
            const result = await ForumPost.delete(postId, null);
            if (!result.success) {
                logger.error('Error deleting forum post (admin):', result.error);
                return errorResponse(res, result.error === 'Forum post not found or unauthorized to delete' ? 404 : 500, result.error);
            }
            response(res, 200, 'Forum post deleted successfully', result.data);
        } catch (error) {
            logger.error('Exception in admin deleteForumPost:', error.message);
            errorResponse(res, 500, error.message);
        }
    }
}

module.exports = AdminForumController;
