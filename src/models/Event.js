const { supabase } = require('../config/database');

class EventModel {
    static async create({ title, description, event_date, location, created_by, max_participants, registration_required = false }) {
        try {
            const { data, error } = await supabase
                .from('events')
                .insert([{ title, description, event_date, location, created_by, max_participants, registration_required }])
                .select('*')
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async listAll({ page = 1, limit = 10 }) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            const { data, error } = await supabase
                .from('events')
                .select('*')
                .order('event_date', { ascending: true })
                .range(from, to);
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async rsvp({ event_id, user_id, status = 'interested' }) {
        try {
            const { data, error } = await supabase
                .from('event_participants')
                .upsert({ event_id, user_id, status }, { onConflict: 'event_id,user_id' })
                .select('*')
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = EventModel;

