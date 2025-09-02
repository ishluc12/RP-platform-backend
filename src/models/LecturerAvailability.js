const { supabase } = require('../config/database');

class LecturerAvailability {
    /**
     * Add a new availability slot for a lecturer
     * @param {Object} params
     * @param {number} params.lecturer_id
     * @param {string} params.available_from - ISO timestamp
     * @param {string} params.available_to - ISO timestamp
     * @param {boolean} [params.recurring=false]
     * @returns {Promise<Object>}
     */
    static async create({ lecturer_id, available_from, available_to, recurring = false }) {
        try {
            const { data, error } = await supabase
                .from('lecturer_availability')
                .insert([{ lecturer_id, available_from, available_to, recurring }])
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get availability slots for a specific lecturer
     * @param {number} lecturerId
     * @param {Object} [options={}]
     * @param {string} [options.start_date] - Filter by start date (ISO timestamp)
     * @param {string} [options.end_date] - Filter by end date (ISO timestamp)
     * @returns {Promise<Object>}
     */
    static async getByLecturer(lecturerId, { start_date, end_date } = {}) {
        try {
            let query = supabase
                .from('lecturer_availability')
                .select('*')
                .eq('lecturer_id', lecturerId)
                .order('available_from', { ascending: true });

            if (start_date) {
                query = query.gte('available_to', start_date); // Ensure slot ends after start_date
            }
            if (end_date) {
                query = query.lte('available_from', end_date); // Ensure slot starts before end_date
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Update an availability slot
     * @param {number} availabilityId
     * @param {number} lecturerId - For authorization
     * @param {Object} updates - Fields to update (available_from, available_to, recurring)
     * @returns {Promise<Object>}
     */
    static async update(availabilityId, lecturerId, updates) {
        try {
            const allowedFields = ['available_from', 'available_to', 'recurring'];
            const filteredUpdates = {};
            allowedFields.forEach(field => {
                if (updates[field] !== undefined) filteredUpdates[field] = updates[field];
            });

            if (Object.keys(filteredUpdates).length === 0) {
                return { success: false, error: 'No valid fields provided for update' };
            }

            const { data, error } = await supabase
                .from('lecturer_availability')
                .update(filteredUpdates)
                .eq('id', availabilityId)
                .eq('lecturer_id', lecturerId) // Ensure only owner can update
                .select('*')
                .single();

            if (error) throw error;
            if (!data) return { success: false, error: 'Availability slot not found or unauthorized' };

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Delete an availability slot
     * @param {number} availabilityId
     * @param {number} lecturerId - For authorization
     * @returns {Promise<Object>}
     */
    static async delete(availabilityId, lecturerId) {
        try {
            const { data, error } = await supabase
                .from('lecturer_availability')
                .delete()
                .eq('id', availabilityId)
                .eq('lecturer_id', lecturerId) // Ensure only owner can delete
                .select('*')
                .single();

            if (error) throw error;
            if (!data) return { success: false, error: 'Availability slot not found or unauthorized' };

            return { success: true, data: { message: 'Availability slot deleted successfully' } };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }
}

module.exports = LecturerAvailability;
