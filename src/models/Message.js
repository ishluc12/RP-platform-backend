const { supabase } = require('../config/database');

class MessageModel {
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
            return { success: false, error: error.message };
        }
    }

    static async thread(userId, otherId, { page = 1, limit = 20 } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            const { data, error } = await supabase
                .from('messages')
                .select('*')
                .or(`and(sender_id.eq.${userId},receiver_id.eq.${otherId}),and(sender_id.eq.${otherId},receiver_id.eq.${userId})`)
                .order('sent_at', { ascending: false })
                .range(from, to);
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = MessageModel;

