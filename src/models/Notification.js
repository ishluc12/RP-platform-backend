const { supabase } = require('../config/database');

class NotificationModel {
    /**
     * List notifications for a specific user with pagination
     * @param {number} user_id
     * @param {Object} options
     * @param {number} [options.page=1]
     * @param {number} [options.limit=20]
     * @returns {Promise<Object>}
     */
    static async listForUser(user_id, { page = 1, limit = 20 } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error } = await supabase
                .from('notifications')
                .select('*')
                .eq('user_id', user_id)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Mark a specific notification as read for a user
     * @param {number} id
     * @param {number} user_id
     * @returns {Promise<Object>}
     */
    static async markRead(id, user_id) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .match({ id, user_id })
                .select('*')
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Mark all notifications as read for a user
     * @param {number} user_id
     * @returns {Promise<Object>}
     */
    static async markAllRead(user_id) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user_id)
                .select('*');

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }
}

module.exports = NotificationModel;

