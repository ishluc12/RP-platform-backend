const { supabase } = require('../config/database');

class PostModel {
    /**
     * Create a new post
     * @param {Object} param0
     * @param {number} param0.user_id
     * @param {string} param0.content
     * @param {string} [param0.image_url]
     * @returns {Promise<Object>}
     */
    static async create({ user_id, content, image_url = null }) {
        try {
            const { data, error } = await supabase
                .from('posts')
                .insert([{ user_id, content, image_url }])
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get paginated feed of posts
     * @param {Object} param0
     * @param {number} [param0.page=1]
     * @param {number} [param0.limit=10]
     * @returns {Promise<Object>}
     */
    static async feed({ page = 1, limit = 10 } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Like a post (or upsert if already liked)
     * @param {Object} param0
     * @param {number} param0.post_id
     * @param {number} param0.user_id
     * @returns {Promise<Object>}
     */
    static async like({ post_id, user_id }) {
        try {
            const { data, error } = await supabase
                .from('post_likes')
                .upsert({ post_id, user_id }, { onConflict: 'post_id,user_id' })
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Unlike a post
     * @param {Object} param0
     * @param {number} param0.post_id
     * @param {number} param0.user_id
     * @returns {Promise<Object>}
     */
    static async unlike({ post_id, user_id }) {
        try {
            const { data, error } = await supabase
                .from('post_likes')
                .delete()
                .match({ post_id, user_id })
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get a single post by ID, with like and comment counts
     * @param {number} postId
     * @returns {Promise<Object>}
     */
    static async getById(postId) {
        try {
            const { data: post, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    users (id, name, email, profile_picture),
                    likes_count:post_likes(count),
                    comments_count:comments(count)
                `)
                .eq('id', postId)
                .single();

            if (error) throw error;

            const formattedPost = {
                ...post,
                likes_count: post.likes_count[0]?.count || 0,
                comments_count: post.comments_count[0]?.count || 0,
                user: post.users
            };
            delete formattedPost.users; // Remove original users object

            return { success: true, data: formattedPost };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Update an existing post
     * @param {number} postId
     * @param {number} userId - The ID of the user trying to update (for authorization)
     * @param {Object} updates - Object containing fields to update (e.g., { content: 'new content' })
     * @returns {Promise<Object>}
     */
    static async update(postId, userId, updates) {
        try {
            const { data, error } = await supabase
                .from('posts')
                .update(updates)
                .eq('id', postId)
                .eq('user_id', userId) // Ensure only the owner can update
                .select('*')
                .single();

            if (error) throw error;

            if (!data) return { success: false, error: 'Post not found or unauthorized to update' };

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Delete a post
     * @param {number} postId
     * @param {number} userId - The ID of the user trying to delete (for authorization)
     * @returns {Promise<Object>}
     */
    static async delete(postId, userId) {
        try {
            const { data, error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId)
                .eq('user_id', userId) // Ensure only the owner can delete
                .select('*')
                .single();

            if (error) throw error;

            if (!data) return { success: false, error: 'Post not found or unauthorized to delete' };

            return { success: true, data: { message: 'Post deleted successfully' } };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }
}

module.exports = PostModel;
