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
}

module.exports = PostModel;
