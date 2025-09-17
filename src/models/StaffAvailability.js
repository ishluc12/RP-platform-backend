const { supabase } = require('../config/database');

class StaffAvailability {
    static async create({ staff_id, day_of_week, start_time, end_time, max_regular_students = 5, max_emergency_students = 2, allow_emergency = true, is_active = true }) {
        try {
            const insertData = {
                staff_id,
                day_of_week,
                start_time,
                end_time,
                max_regular_students,
                max_emergency_students,
                allow_emergency,
                is_active,
            };
            const { data, error } = await supabase
                .from('staff_availability')
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
                .from('staff_availability')
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
                .from('staff_availability')
                .select('*')
                .eq('staff_id', staffId)
                .order('day_of_week', { ascending: true });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async update(id, updateData) {
        const allowedFields = [
            'day_of_week', 'start_time', 'end_time', 'max_regular_students', 'max_emergency_students', 'allow_emergency', 'is_active'
        ];
        const filteredUpdate = {};
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) filteredUpdate[field] = updateData[field];
        });

        try {
            const { data, error } = await supabase
                .from('staff_availability')
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
                .from('staff_availability')
                .delete()
                .eq('id', id);
            if (error) throw error;
            return { success: true, message: 'Staff availability deleted successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = StaffAvailability;
