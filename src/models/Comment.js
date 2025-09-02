const { supabase } = require('../config/database');

class Comment {
    /**
     * Create a new comment on a post
     * @param {Object} params
     * @param {number} params.post_id
     * @param {number} params.user_id
     * @param {string} params.content
     * @returns {Promise<Object>}
     */
    static async create({ post_id, user_id, content }) {
        try {
            const { data, error } = await supabase
                .from('comments')
                .insert([{ post_id, user_id, content }])
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get comments for a specific post
     * @param {number} postId
     * @param {Object} [options={}]
     * @param {number} [options.page=1]
     * @param {number} [options.limit=10]
     * @returns {Promise<Object>}
     */
    static async getCommentsByPost(postId, { page = 1, limit = 10 } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error } = await supabase
                .from('comments')
                .select(`
                    *,
                    users (id, name, profile_picture)
                `)
                .eq('post_id', postId)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            const formattedComments = data.map(comment => ({
                ...comment,
                user: comment.users
            }));

            return { success: true, data: formattedComments };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Delete a comment
     * @param {number} commentId
     * @param {number} userId - The ID of the user trying to delete (for authorization)
     * @returns {Promise<Object>}
     */
    static async delete(commentId, userId) {
        try {
            const { data, error } = await supabase
                .from('comments')
                .delete()
                .eq('id', commentId)
                .eq('user_id', userId) // Ensure only the owner can delete
                .select('*')
                .single();

            if (error) throw error;

            if (!data) return { success: false, error: 'Comment not found or unauthorized to delete' };

            return { success: true, data: { message: 'Comment deleted successfully' } };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }
}

module.exports = Comment;
