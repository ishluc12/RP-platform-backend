const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class AvailabilityException {
    /**
     * Create availability exception
     * @param {Object} exceptionData - Exception data
     * @returns {Promise<Object>} - Success/error result
     */
    static async create(exceptionData) {
        try {
            const {
                staff_id,
                exception_date,
                exception_type = 'unavailable',
                start_time,
                end_time,
                reason,
                is_recurring = false
            } = exceptionData;

            // Validate required fields
            if (!staff_id || !exception_date) {
                throw new Error('Missing required fields: staff_id, exception_date');
            }

            // Validate exception type and times
            if (exception_type === 'unavailable' && (start_time || end_time)) {
                throw new Error('Unavailable exceptions cannot have start_time or end_time');
            }
            if (exception_type !== 'unavailable' && (!start_time || !end_time)) {
                throw new Error('Modified/extra hours exceptions require start_time and end_time');
            }

            const { data, error } = await supabase
                .from('availability_exceptions')
                .insert({
                    staff_id,
                    exception_date,
                    exception_type,
                    start_time,
                    end_time,
                    reason,
                    is_recurring
                })
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating availability exception:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get exceptions for a staff member
     * @param {string} staffId - Staff UUID
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} - Success/error result
     */
    static async getByStaff(staffId, filters = {}) {
        try {
            let query = supabase
                .from('availability_exceptions')
                .select('*')
                .eq('staff_id', staffId)
                .order('exception_date', { ascending: true });

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

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching staff exceptions:', error);
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
                .from('availability_exceptions')
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
                .from('availability_exceptions')
                .delete()
                .eq('id', exceptionId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting exception:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get exceptions for a specific date range
     * @param {string} startDate - Start date in YYYY-MM-DD format
     * @param {string} endDate - End date in YYYY-MM-DD format
     * @param {string} staffId - Optional staff ID filter
     * @returns {Promise<Object>} - Success/error result
     */
    static async getByDateRange(startDate, endDate, staffId = null) {
        try {
            let query = supabase
                .from('availability_exceptions')
                .select(`
                    *,
                    staff:staff_id(name, email, staff_id, department)
                `)
                .gte('exception_date', startDate)
                .lte('exception_date', endDate)
                .order('exception_date', { ascending: true });

            if (staffId) {
                query = query.eq('staff_id', staffId);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching exceptions by date range:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if staff has exception on specific date
     * @param {string} staffId - Staff UUID
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} exceptionType - Optional exception type filter
     * @returns {Promise<Object>} - Success/error result
     */
    static async checkExceptionOnDate(staffId, date, exceptionType = null) {
        try {
            let query = supabase
                .from('availability_exceptions')
                .select('*')
                .eq('staff_id', staffId)
                .eq('exception_date', date);

            if (exceptionType) {
                query = query.eq('exception_type', exceptionType);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data: data.length > 0 ? data[0] : null };
        } catch (error) {
            console.error('Error checking exception on date:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Create recurring exceptions
     * @param {string} staffId - Staff UUID
     * @param {Object} exceptionData - Base exception data
     * @param {Array} dates - Array of dates for recurring exceptions
     * @returns {Promise<Object>} - Success/error result
     */
    static async createRecurring(staffId, exceptionData, dates) {
        try {
            const exceptions = dates.map(date => ({
                staff_id: staffId,
                exception_date: date,
                ...exceptionData,
                is_recurring: true
            }));

            const { data, error } = await supabase
                .from('availability_exceptions')
                .insert(exceptions)
                .select('*');

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating recurring exceptions:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get upcoming exceptions for staff
     * @param {string} staffId - Staff UUID
     * @param {number} days - Number of days to look ahead (default: 30)
     * @returns {Promise<Object>} - Success/error result
     */
    static async getUpcoming(staffId, days = 30) {
        try {
            const today = new Date().toISOString().split('T')[0];
            const futureDate = new Date();
            futureDate.setDate(futureDate.getDate() + days);
            const futureDateStr = futureDate.toISOString().split('T')[0];

            const { data, error } = await supabase
                .from('availability_exceptions')
                .select('*')
                .eq('staff_id', staffId)
                .gte('exception_date', today)
                .lte('exception_date', futureDateStr)
                .order('exception_date', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching upcoming exceptions:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get exception statistics for staff
     * @param {string} staffId - Staff UUID
     * @param {string} startDate - Start date for statistics
     * @param {string} endDate - End date for statistics
     * @returns {Promise<Object>} - Success/error result
     */
    static async getStats(staffId, startDate, endDate) {
        try {
            const { data, error } = await supabase
                .from('availability_exceptions')
                .select('exception_type, exception_date')
                .eq('staff_id', staffId)
                .gte('exception_date', startDate)
                .lte('exception_date', endDate);

            if (error) throw error;

            const stats = {
                total: data.length,
                unavailable: data.filter(e => e.exception_type === 'unavailable').length,
                modified_hours: data.filter(e => e.exception_type === 'modified_hours').length,
                extra_hours: data.filter(e => e.exception_type === 'extra_hours').length,
                recurring: data.filter(e => e.is_recurring).length
            };

            return { success: true, data: stats };
        } catch (error) {
            console.error('Error fetching exception stats:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = AvailabilityException;