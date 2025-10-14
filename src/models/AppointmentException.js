const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class AppointmentException {
    /**
     * Create appointment exception
     * @param {Object} exceptionData - Exception data
     * @returns {Promise<Object>} - Success/error result
     */
    static async create(exceptionData) {
        try {
            const {
                appointment_id,
                exception_type,
                reason,
                created_by
            } = exceptionData;

            // Validate required fields
            if (!appointment_id || !exception_type) {
                throw new Error('Missing required fields: appointment_id, exception_type');
            }

            const { data, error } = await supabase
                .from('appointment_exceptions')
                .insert({
                    appointment_id,
                    exception_type,
                    reason,
                    created_by
                })
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating appointment exception:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get exceptions for an appointment
     * @param {string} appointmentId - Appointment UUID
     * @returns {Promise<Object>} - Success/error result
     */
    static async getByAppointment(appointmentId) {
        try {
            const { data, error } = await supabase
                .from('appointment_exceptions')
                .select('*')
                .eq('appointment_id', appointmentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching appointment exceptions:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update exception
     * @param {string} exceptionId - Exception UUID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} - Success/error result
     */
    static async update(exceptionId, updateData) {
        try {
            const { data, error } = await supabase
                .from('appointment_exceptions')
                .update(updateData)
                .eq('id', exceptionId)
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating exception:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete exception
     * @param {string} exceptionId - Exception UUID
     * @returns {Promise<Object>} - Success/error result
     */
    static async delete(exceptionId) {
        try {
            const { error } = await supabase
                .from('appointment_exceptions')
                .delete()
                .eq('id', exceptionId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting exception:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = AppointmentException;
