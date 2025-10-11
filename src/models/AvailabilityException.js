const { supabase } = require('../config/database');

class AvailabilityException {
    /**
     * Create exception
     */
    static async create(exceptionData) {
        try {
            const { data, error } = await supabase
                .from('availability_exceptions')
                .insert([exceptionData])
                .select(`
                    *,
                    staff:staff_id(id, name, email, department, role)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get exceptions by staff
     */
    static async getByStaff(staffId, filters = {}) {
        try {
            let query = supabase
                .from('availability_exceptions')
                .select(`
                    *,
                    staff:staff_id(id, name, email, department, role)
                `)
                .eq('staff_id', staffId);

            if (filters.exception_type) {
                query = query.eq('exception_type', filters.exception_type);
            }

            if (filters.start_date) {
                query = query.gte('exception_date', filters.start_date);
            }

            if (filters.end_date) {
                query = query.lte('exception_date', filters.end_date);
            }

            if (filters.is_recurring !== undefined) {
                query = query.eq('is_recurring', filters.is_recurring);
            }

            const { data, error } = await query.order('exception_date', { ascending: true });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get upcoming exceptions
     */
    static async getUpcoming(staffId, days = 30) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);
            const futureDateStr = futureDate.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('availability_exceptions')
                .select(`
                    *,
                    staff:staff_id(id, name, email, department, role)
                `)
                .eq('staff_id', staffId)
                .gte('exception_date', today)
                .lte('exception_date', futureDateStr)
                .order('exception_date', { ascending: true });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Update exception
     */
    static async update(exceptionId, updates) {
        try {
            const { data, error } = await supabase
                .from('availability_exceptions')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', exceptionId)
                .select(`
                    *,
                    staff:staff_id(id, name, email, department, role)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete exception
     */
    static async delete(exceptionId) {
        try {
            const { error } = await supabase
                .from('availability_exceptions')
                .delete()
                .eq('id', exceptionId);

            if (error) throw error;
            return { success: true, message: 'Exception deleted successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = AvailabilityException;