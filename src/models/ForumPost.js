const { supabase } = require('../config/database');

class ForumPost {
    /**
     * Create a new post in a forum
     * @param {Object} params
     * @param {number} params.forum_id
     * @param {number} params.user_id
     * @param {string} params.content
     * @returns {Promise<Object>}
     */
    static async create({ forum_id, user_id, content }) {
        try {
            const { data, error } = await supabase
                .from('forum_posts')
                .insert([{ forum_id, user_id, content }])
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get posts for a specific forum
     * @param {number} forumId
     * @param {Object} [options={}]
     * @param {number} [options.page=1]
     * @param {number} [options.limit=10]
     * @returns {Promise<Object>}
     */
    static async getPostsByForum(forumId, { page = 1, limit = 10 } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error } = await supabase
                .from('forum_posts')
                .select(`
                    *,
                    users (id, name, profile_picture)
                `)
                .eq('forum_id', forumId)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const formattedPosts = data.map(post => ({
                ...post,
                user: post.users
            }));

            return { success: true, data: formattedPosts };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get a single forum post by ID
     * @param {number} postId
     * @returns {Promise<Object>}
     */
    static async getById(postId) {
        try {
            const { data: post, error } = await supabase
                .from('forum_posts')
                .select(`
                    *,
                    users (id, name, profile_picture),
                    forums (id, title)
                `)
                .eq('id', postId)
                .single();

            if (error) throw error;
            if (!post) return { success: false, error: 'Forum post not found' };

            const formattedPost = {
                ...post,
                user: post.users,
                forum: post.forums
            };
            delete formattedPost.users;
            delete formattedPost.forums;

            return { success: true, data: formattedPost };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Update a forum post
     * @param {number} postId
     * @param {number} userId - The ID of the user trying to update (for authorization)
     * @param {Object} updates - Object containing fields to update (e.g., { content: 'new content' })
     * @returns {Promise<Object>}
     */
    static async update(postId, userId, updates) {
        try {
            const { data, error } = await supabase
                .from('forum_posts')
                .update(updates)
                .eq('id', postId)
                .eq('user_id', userId) // Ensure only the owner can update
                .select('*')
                .single();

            if (error) throw error;

            if (!data) return { success: false, error: 'Forum post not found or unauthorized to update' };

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Delete a forum post
     * @param {number} postId
     * @param {number} userId - The ID of the user trying to delete (for authorization)
     * @returns {Promise<Object>}
     */
    static async delete(postId, userId) {
        try {
            const { data, error } = await supabase
                .from('forum_posts')
                .delete()
                .eq('id', postId)
                .eq('user_id', userId) // Ensure only the owner can delete
                .select('*')
                .single();

            if (error) throw error;

            if (!data) return { success: false, error: 'Forum post not found or unauthorized to delete' };

            return { success: true, data: { message: 'Forum post deleted successfully' } };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }
}

module.exports = ForumPost;
