const { supabase } = require('../config/database');

class NotificationModel {
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
            return { success: false, error: error.message };
        }
    }

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
            return { success: false, error: error.message };
        }
    }
}

module.exports = NotificationModel;

