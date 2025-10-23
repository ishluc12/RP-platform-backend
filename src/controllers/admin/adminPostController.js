const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');
const { supabase, supabaseAdmin } = require('../../config/database');

// Prefer service-role client to bypass RLS on server-side trusted operations
const db = supabaseAdmin || supabase;

class AdminPostController {
    /**
     * Get all posts for admin moderation
     */
    static async getAllPosts(req, res) {
        try {
            const { page = 1, limit = 50, status, search } = req.query;
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            let query = db
                .from('posts')
                .select(`
                    *,
                    users!posts_user_id_fkey (
                        id,
                        name,
                        email,
                        role,
                        profile_picture
                    )
                `)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (status) {
                query = query.eq('status', status);
            }

            if (search) {
                query = query.or(`content.ilike.%${search}%,users.name.ilike.%${search}%`);
            }

            const { data: posts, error } = await query;

            if (error) throw error;
            
            // Format the response to match frontend expectations
            const formattedPosts = posts.map(post => ({
                id: post.id,
                content: post.content,
                description: post.description,
                image_url: post.image_url,
                video_url: post.video_url,
                media_type: post.media_type,
                sticker: post.sticker,
                created_at: post.created_at,
                status: post.status || 'active',
                is_blocked: post.status === 'blocked',
                is_flagged: post.status === 'flagged',
                moderation_reason: post.moderation_reason,
                likes_count: 0, // Will be calculated separately if needed
                comments_count: 0, // Will be calculated separately if needed
                user: {
                    id: post.user_id,
                    name: post.users?.name,
                    email: post.users?.email,
                    role: post.users?.role,
                    profile_picture: post.users?.profile_picture
                }
            }));

            response(res, 200, 'Posts retrieved successfully', formattedPosts);
        } catch (error) {
            logger.error('Error fetching posts for admin:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Delete a post
     */
    static async deletePost(req, res) {
        try {
            const { id } = req.params;

            // Check if post exists
            const { data: existingPost, error: checkError } = await db
                .from('posts')
                .select('id')
                .eq('id', id)
                .single();

            if (checkError || !existingPost) {
                return errorResponse(res, 404, 'Post not found');
            }

            // Delete related records first
            await db.from('post_likes').delete().eq('post_id', id);
            await db.from('comments').delete().eq('post_id', id);
            
            // Delete the post
            const { error: deleteError } = await db
                .from('posts')
                .delete()
                .eq('id', id);

            if (deleteError) throw deleteError;

            response(res, 200, 'Post deleted successfully', { id });
        } catch (error) {
            logger.error('Error deleting post:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Block a post
     */
    static async blockPost(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const { data, error } = await db
                .from('posts')
                .update({
                    status: 'blocked',
                    moderation_reason: reason || 'Blocked by administrator',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return errorResponse(res, 404, 'Post not found');
                }
                throw error;
            }

            response(res, 200, 'Post blocked successfully', data);
        } catch (error) {
            logger.error('Error blocking post:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Unblock a post
     */
    static async unblockPost(req, res) {
        try {
            const { id } = req.params;

            const { data, error } = await db
                .from('posts')
                .update({
                    status: 'active',
                    moderation_reason: null,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return errorResponse(res, 404, 'Post not found');
                }
                throw error;
            }

            response(res, 200, 'Post unblocked successfully', data);
        } catch (error) {
            logger.error('Error unblocking post:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Flag a post
     */
    static async flagPost(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const { data, error } = await db
                .from('posts')
                .update({
                    status: 'flagged',
                    moderation_reason: reason || 'Flagged for review',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return errorResponse(res, 404, 'Post not found');
                }
                throw error;
            }

            response(res, 200, 'Post flagged successfully', data);
        } catch (error) {
            logger.error('Error flagging post:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Ban a user (update user status)
     */
    static async banUser(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            const { data, error } = await db
                .from('users')
                .update({
                    status: 'blocked',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return errorResponse(res, 404, 'User not found');
                }
                throw error;
            }

            // Also block all posts by this user
            await db
                .from('posts')
                .update({
                    status: 'blocked',
                    moderation_reason: reason || 'User banned by administrator'
                })
                .eq('user_id', id);

            response(res, 200, 'User banned successfully', data);
        } catch (error) {
            logger.error('Error banning user:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Unban a user
     */
    static async unbanUser(req, res) {
        try {
            const { id } = req.params;

            const { data, error } = await db
                .from('users')
                .update({
                    status: 'active',
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return errorResponse(res, 404, 'User not found');
                }
                throw error;
            }

            response(res, 200, 'User unbanned successfully', data);
        } catch (error) {
            logger.error('Error unbanning user:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = AdminPostController;