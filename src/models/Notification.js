const { supabase } = require('../config/database');

class NotificationModel {
    /**
     * Create a new notification
     * @param {Object} notificationData
     * @param {string} notificationData.user_id - ID of the recipient user
     * @param {string} notificationData.type - Type of notification (e.g., 'event_new', 'message_new', 'event_update')
     * @param {string} notificationData.content - The notification message
     * @param {string} [notificationData.source_id] - ID of the source entity (e.g., event_id, message_id)
     * @param {string} [notificationData.source_table] - Table name of the source entity (e.g., 'events', 'messages')
     * @returns {Promise<Object>}
     */
    static async createNotification({ user_id, type, content, source_id = null, source_table = null }) {
        try {
            const { data, error } = await supabase
                .from('notifications')
                .insert([{ user_id, type, content, source_id, source_table }])
                .select('*')
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * List notifications for a specific user with pagination
     * @param {string} user_id
     * @param {Object} options
     * @param {number} [options.page=1]
     * @param {number} [options.limit=20]
     * @returns {Promise<Object>}
     */
    static async listForUser(user_id, { page = 1, limit = 20 } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error, count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact' })
                .eq('user_id', user_id)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            return {
                success: true,
                data: {
                    notifications: data || [],
                    pagination: {
                        page,
                        limit,
                        total: count,
                        pages: Math.ceil(count / limit)
                    }
                }
            };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * List unread notifications for a specific user
     * @param {string} user_id
     * @returns {Promise<Object>}
     */
    static async listUnreadForUser(user_id) {
        try {
            const { data, error, count } = await supabase
                .from('notifications')
                .select('*', { count: 'exact' })
                .eq('user_id', user_id)
                .eq('is_read', false) // Filter for unread notifications
                .order('created_at', { ascending: false });

            if (error) throw error;

            return {
                success: true,
                data: data || [], // Return just the array of notifications
                pagination: { // Optional: You might not need pagination for unread, but keeping structure consistent
                    total: count,
                    // page, limit are not used in this specific query, but can be added if needed
                }
            };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Mark a specific notification as read for a user
     * @param {string} id
     * @param {string} user_id
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
     * @param {string} user_id
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

