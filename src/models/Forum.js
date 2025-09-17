const { supabase } = require('../config/database');

class Forum {
    /**
     * Create a new forum
     * @param {Object} params
     * @param {string} params.title
     * @param {string} [params.description]
     * @param {string} params.created_by
     * @returns {Promise<Object>}
     */
    static async create({ title, description = null, created_by }) {
        try {
            const { data, error } = await supabase
                .from('forums')
                .insert([{ title, description, created_by }])
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get all forums
     * @param {Object} [options={}]
     * @param {number} [options.page=1]
     * @param {number} [options.limit=10]
     * @returns {Promise<Object>}
     */
    static async getAll({ page = 1, limit = 10 } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error } = await supabase
                .from('forums')
                .select(`
                    *,
                    created_by:users(id, name, profile_picture),
                    posts_count:forum_posts(count)
                `)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const formattedForums = data.map(forum => ({
                ...forum,
                created_by: forum.created_by,
                posts_count: forum.posts_count[0]?.count || 0
            }));

            return { success: true, data: formattedForums };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get a forum by ID
     * @param {string} forumId
     * @returns {Promise<Object>}
     */
    static async getById(forumId) {
        try {
            const { data: forum, error } = await supabase
                .from('forums')
                .select(`
                    *,
                    created_by:users(id, name, profile_picture),
                    posts_count:forum_posts(count)
                `)
                .eq('id', forumId)
                .single();

            if (error) throw error;

            if (!forum) return { success: false, error: 'Forum not found' };

            const formattedForum = {
                ...forum,
                created_by: forum.created_by,
                posts_count: forum.posts_count[0]?.count || 0
            };

            return { success: true, data: formattedForum };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Update a forum
     * @param {string} forumId
     * @param {string} userId - The ID of the user trying to update (for authorization)
     * @param {Object} updates - Object containing fields to update (e.g., { title: 'new title' })
     * @returns {Promise<Object>}
     */
    static async update(forumId, userId, updates) {
        try {
            const { data, error } = await supabase
                .from('forums')
                .update(updates)
                .eq('id', forumId)
                .eq('created_by', userId) // Ensure only the creator can update
                .select('*')
                .single();

            if (error) throw error;

            if (!data) return { success: false, error: 'Forum not found or unauthorized to update' };

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Delete a forum
     * @param {number} forumId
     * @param {number} userId - The ID of the user trying to delete (for authorization)
     * @returns {Promise<Object>}
     */
    static async delete(forumId, userId) {
        try {
            const { data, error } = await supabase
                .from('forums')
                .delete()
                .eq('id', forumId)
                .eq('created_by', userId) // Ensure only the creator can delete
                .select('*')
                .single();

            if (error) throw error;

            if (!data) return { success: false, error: 'Forum not found or unauthorized to delete' };

            return { success: true, data: { message: 'Forum deleted successfully' } };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }
}

module.exports = Forum;
