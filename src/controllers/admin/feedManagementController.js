const Post = require('../../models/Post');
const Comment = require('../../models/Comment');
const User = require('../../models/User');
const NotificationModel = require('../../models/Notification');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

/**
 * Get all posts with moderation capabilities (sys-admin only)
 */
const getAllPostsForModeration = async (req, res) => {
    try {
        // Only sys-admin can access this
        if (req.user.role !== 'sys_admin') {
            return errorResponse(res, 403, 'Access denied. Sys-admin role required.');
        }

        const { page = 1, limit = 20, status, search } = req.query;
        
        // Build filters
        const filters = {};
        if (status) filters.status = status;
        if (search) filters.search = search;

        const result = await Post.getAllForModeration(parseInt(page), parseInt(limit), filters);
        
        if (!result.success) {
            return errorResponse(res, 500, 'Failed to fetch posts for moderation');
        }

        response(res, 200, 'Posts fetched for moderation', {
            posts: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getAllPostsForModeration:', error.message);
        errorResponse(res, 500, 'Internal server error');
    }
};

/**
 * Moderate a post (approve, reject, remove, etc.)
 */
const moderatePost = async (req, res) => {
    try {
        // Only sys-admin can moderate
        if (req.user.role !== 'sys_admin') {
            return errorResponse(res, 403, 'Access denied. Sys-admin role required.');
        }

        const { postId } = req.params;
        const { action, reason } = req.body;

        const validActions = ['approve', 'reject', 'remove', 'flag', 'unflag'];
        if (!action || !validActions.includes(action)) {
            return errorResponse(res, 400, `Invalid action. Must be one of: ${validActions.join(', ')}`);
        }

        // Get the post first
        const postResult = await Post.findById(postId);
        if (!postResult.success) {
            return errorResponse(res, 404, 'Post not found');
        }

        const post = postResult.data;

        // Perform the moderation action
        let updateData = { 
            moderated_by: req.user.id,
            moderated_at: new Date().toISOString(),
            moderation_reason: reason || null
        };

        switch (action) {
            case 'approve':
                updateData.status = 'approved';
                updateData.is_visible = true;
                break;
            case 'reject':
                updateData.status = 'rejected';
                updateData.is_visible = false;
                break;
            case 'remove':
                updateData.status = 'removed';
                updateData.is_visible = false;
                break;
            case 'flag':
                updateData.is_flagged = true;
                break;
            case 'unflag':
                updateData.is_flagged = false;
                break;
        }

        const result = await Post.updateById(postId, updateData);
        if (!result.success) {
            return errorResponse(res, 500, 'Failed to moderate post');
        }

        // Send notification to post author if necessary
        if (['reject', 'remove'].includes(action)) {
            await NotificationModel.createNotification({
                user_id: post.user_id,
                type: 'post_moderated',
                content: `Your post "${post.content.substring(0, 50)}..." has been ${action}ed by moderation${reason ? ': ' + reason : ''}`,
                source_id: postId,
                source_table: 'posts',
            });
        }

        // Log the moderation action
        logger.info(`Post ${postId} ${action}ed by sys-admin ${req.user.id}${reason ? '. Reason: ' + reason : ''}`);

        response(res, 200, `Post ${action}ed successfully`, result.data);
    } catch (error) {
        logger.error('Error in moderatePost:', error.message);
        errorResponse(res, 500, 'Internal server error');
    }
};

/**
 * Get reported/flagged posts for review
 */
const getFlaggedPosts = async (req, res) => {
    try {
        if (req.user.role !== 'sys_admin') {
            return errorResponse(res, 403, 'Access denied. Sys-admin role required.');
        }

        const { page = 1, limit = 20 } = req.query;

        const result = await Post.getFlagged(parseInt(page), parseInt(limit));
        
        if (!result.success) {
            return errorResponse(res, 500, 'Failed to fetch flagged posts');
        }

        response(res, 200, 'Flagged posts fetched successfully', {
            posts: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getFlaggedPosts:', error.message);
        errorResponse(res, 500, 'Internal server error');
    }
};

/**
 * Get moderation statistics
 */
const getModerationStats = async (req, res) => {
    try {
        if (req.user.role !== 'sys_admin') {
            return errorResponse(res, 403, 'Access denied. Sys-admin role required.');
        }

        const { timeframe = '30' } = req.query; // days
        
        const result = await Post.getModerationStats(parseInt(timeframe));
        
        if (!result.success) {
            return errorResponse(res, 500, 'Failed to fetch moderation statistics');
        }

        response(res, 200, 'Moderation statistics fetched successfully', result.data);
    } catch (error) {
        logger.error('Error in getModerationStats:', error.message);
        errorResponse(res, 500, 'Internal server error');
    }
};

/**
 * Bulk moderate multiple posts
 */
const bulkModerate = async (req, res) => {
    try {
        if (req.user.role !== 'sys_admin') {
            return errorResponse(res, 403, 'Access denied. Sys-admin role required.');
        }

        const { postIds, action, reason } = req.body;

        if (!postIds || !Array.isArray(postIds) || postIds.length === 0) {
            return errorResponse(res, 400, 'Post IDs array is required');
        }

        const validActions = ['approve', 'reject', 'remove', 'flag', 'unflag'];
        if (!action || !validActions.includes(action)) {
            return errorResponse(res, 400, `Invalid action. Must be one of: ${validActions.join(', ')}`);
        }

        let successCount = 0;
        let failedIds = [];

        for (const postId of postIds) {
            try {
                // Get the post
                const postResult = await Post.findById(postId);
                if (!postResult.success) {
                    failedIds.push(postId);
                    continue;
                }

                const post = postResult.data;

                // Perform moderation action
                let updateData = { 
                    moderated_by: req.user.id,
                    moderated_at: new Date().toISOString(),
                    moderation_reason: reason || null
                };

                switch (action) {
                    case 'approve':
                        updateData.status = 'approved';
                        updateData.is_visible = true;
                        break;
                    case 'reject':
                        updateData.status = 'rejected';
                        updateData.is_visible = false;
                        break;
                    case 'remove':
                        updateData.status = 'removed';
                        updateData.is_visible = false;
                        break;
                    case 'flag':
                        updateData.is_flagged = true;
                        break;
                    case 'unflag':
                        updateData.is_flagged = false;
                        break;
                }

                const result = await Post.updateById(postId, updateData);
                if (result.success) {
                    successCount++;

                    // Send notification for rejected/removed posts
                    if (['reject', 'remove'].includes(action)) {
                        await NotificationModel.createNotification({
                            user_id: post.user_id,
                            type: 'post_moderated',
                            content: `Your post "${post.content.substring(0, 50)}..." has been ${action}ed by moderation${reason ? ': ' + reason : ''}`,
                            source_id: postId,
                            source_table: 'posts',
                        });
                    }
                } else {
                    failedIds.push(postId);
                }
            } catch (error) {
                logger.error(`Error moderating post ${postId}:`, error.message);
                failedIds.push(postId);
            }
        }

        logger.info(`Bulk moderation: ${successCount} posts ${action}ed, ${failedIds.length} failed by sys-admin ${req.user.id}`);

        response(res, 200, 'Bulk moderation completed', {
            successCount,
            failedCount: failedIds.length,
            failedIds: failedIds.length > 0 ? failedIds : undefined
        });
    } catch (error) {
        logger.error('Error in bulkModerate:', error.message);
        errorResponse(res, 500, 'Internal server error');
    }
};

/**
 * Get user's post history for review
 */
const getUserPostHistory = async (req, res) => {
    try {
        if (req.user.role !== 'sys_admin') {
            return errorResponse(res, 403, 'Access denied. Sys-admin role required.');
        }

        const { userId } = req.params;
        const { page = 1, limit = 20 } = req.query;

        const result = await Post.getUserPosts(userId, parseInt(page), parseInt(limit));
        
        if (!result.success) {
            return errorResponse(res, 500, 'Failed to fetch user post history');
        }

        response(res, 200, 'User post history fetched successfully', {
            posts: result.data,
            pagination: result.pagination
        });
    } catch (error) {
        logger.error('Error in getUserPostHistory:', error.message);
        errorResponse(res, 500, 'Internal server error');
    }
};

module.exports = {
    getAllPostsForModeration,
    moderatePost,
    getFlaggedPosts,
    getModerationStats,
    bulkModerate,
    getUserPostHistory
};