const { supabase } = require('../config/database');

class AvailabilityException {
    static async create({ staff_id, exception_date, exception_type = 'unavailable', start_time = null, end_time = null, reason = null }) {
        try {
            const insertData = {
                staff_id,
                exception_date,
                exception_type,
                start_time,
                end_time,
                reason,
            };
            const { data, error } = await supabase
                .from('availability_exceptions')
                .insert([insertData])
                .select('*')
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async findById(id) {
        try {
            const { data, error } = await supabase
                .from('availability_exceptions')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async findByStaffId(staffId) {
        try {
            const { data, error } = await supabase
                .from('availability_exceptions')
                .select('*')
                .eq('staff_id', staffId)
                .order('exception_date', { ascending: true });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async update(id, updateData) {
        const allowedFields = [
            'exception_date', 'exception_type', 'start_time', 'end_time', 'reason'
        ];
        const filteredUpdate = {};
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) filteredUpdate[field] = updateData[field];
        });

        try {
            const { data, error } = await supabase
                .from('availability_exceptions')
                .update(filteredUpdate)
                .eq('id', id)
                .select('*')
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async delete(id) {
        try {
            const { error } = await supabase
                .from('availability_exceptions')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return { success: true, message: 'Availability exception deleted successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = AvailabilityException;
