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

    /**
     * Get messages for a specific group chat
     * @param {number} groupId
     * @param {Object} options
     * @param {number} [options.page=1]
     * @param {number} [options.limit=20]
     * @returns {Promise<Object>}
     */
    static async getGroupMessages(groupId, { page = 1, limit = 20 } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .eq('group_id', groupId)
                .eq('is_group', true)
                .order('sent_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || error.details || 'Unknown error' };
        }
    }

    /**
     * Get a list of all direct message conversations for a user
     * @param {number} userId
     * @returns {Promise<Object>}
     */
    static async getUserConversations(userId) {
        try {
            // Find all unique users this user has messaged or received messages from
            const { data, error } = await supabase.rpc('get_user_conversations', { p_user_id: userId });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || error.details || 'Unknown error' };
        }
    }

    /**
     * Get a list of all group chats a user is a member of
     * @param {number} userId
     * @returns {Promise<Object>}
     */
    static async getUserGroupChats(userId) {
        try {
            const { data, error } = await supabase
                .from('group_members')
                .select(`
                    group_id,
                    chat_groups (id, name, created_by, created_at)
                `)
                .eq('user_id', userId);

            if (error) throw error;

            // Extract and flatten group data
            const groupChats = data.map(member => member.chat_groups);

            return { success: true, data: groupChats };
        } catch (error) {
            return { success: false, error: error.message || error.details || 'Unknown error' };
        }
    }
}

module.exports = MessageModel;
