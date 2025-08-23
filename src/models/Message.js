const { supabase } = require('../config/database');

class MessageModel {
    /**
     * Send a message to a user or group
     * @param {Object} params
     * @param {number} params.sender_id
     * @param {number} params.receiver_id
     * @param {string} params.message
     * @param {boolean} [params.is_group=false]
     * @param {number|null} [params.group_id=null]
     * @param {string} [params.message_type='text']
     * @returns {Promise<Object>}
     */
    static async send({ sender_id, receiver_id, message, is_group = false, group_id = null, message_type = 'text' }) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([{ sender_id, receiver_id, message, is_group, group_id, message_type }])
                .select('*')
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || error.details || 'Unknown error' };
        }
    }

    /**
     * Get conversation thread between two users
     * @param {number} userId
     * @param {number} otherId
     * @param {Object} options
     * @param {number} [options.page=1]
     * @param {number} [options.limit=20]
     * @returns {Promise<Object>}
     */
    static async thread(userId, otherId, { page = 1, limit = 20 } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            // Bi-directional thread query
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(
                    `(and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId}))`
                )
                .order('sent_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || error.details || 'Unknown error' };
        }
    }

    /**
     * Get all messages sent by a user (optional)
     * @param {number} userId
     * @param {Object} options
     * @param {number} [options.page=1]
     * @param {number} [options.limit=50]
     * @returns {Promise<Object>}
     */
    static async listSent(userId, { page = 1, limit = 50 } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('sender_id', userId)
                .order('sent_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || error.details || 'Unknown error' };
        }
    }
}

module.exports = MessageModel;
