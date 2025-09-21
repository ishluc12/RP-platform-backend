const { supabase } = require('../config/database');

class Announcement {
    static async create({ content, created_by }) {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .insert([{ content, created_by, created_at: new Date().toISOString() }])
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    static async list() {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .select(`
                    id,
                    content,
                    created_at,
                    created_by,
                    users(name)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;

            const formattedAnnouncements = data.map(announcement => ({
                ...announcement,
                created_by_name: announcement.users?.name || 'Unknown',
                users: undefined // remove the nested users object
            }));

            return { success: true, data: formattedAnnouncements };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    static async update(id, { content }) {
        try {
            const { data, error } = await supabase
                .from('announcements')
                .update({ content, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    static async delete(id) {
        try {
            const { error } = await supabase
                .from('announcements')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true, message: 'Announcement deleted successfully' };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }
}

module.exports = Announcement;
