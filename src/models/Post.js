const { supabase } = require('../config/database');

class PostModel {
    static async create({ user_id, content, image_url }) {
        try {
            const { data, error } = await supabase
                .from('posts')
                .insert([{ user_id, content, image_url }])
                .select('*')
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async feed({ page = 1, limit = 10 }) {
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
            return { success: false, error: error.message };
        }
    }

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
            return { success: false, error: error.message };
        }
    }
}

module.exports = PostModel;

