const { createClient } = require('@supabase/supabase-js');
const { logger } = require('../utils/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class StaffAvailability {
    /**
     * Find availability slots by staff ID
     * @param {string} staffId - Staff ID
     * @param {Object} options - Filter options
     * @returns {Promise<Object>} - Success/error result
     */
    static async findByStaffId(staffId, options = {}) {
        try {
            const { isActive, orderBy = 'day_of_week', orderDirection = 'asc' } = options;
            
            let query = supabase
                .from('staff_availability')
                .select('*')
                .eq('staff_id', staffId)
                .order(orderBy, { ascending: orderDirection === 'asc' });
                
            if (isActive !== undefined) {
                query = query.eq('is_active', isActive);
            }
            
            const { data, error } = await query;
            
            if (error) {
                logger.error('Error finding availability by staff ID:', error);
                return { success: false, error: error.message };
            }
            
            return { success: true, data };
        } catch (error) {
            logger.error('Error in findByStaffId:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Create availability slot for staff
     * @param {Object} availabilityData - Availability data
     * @returns {Promise<Object>} - Success/error result
     */
    static async create(availabilityData) {
        try {
            const {
                staff_id,
                day_of_week,
                start_time,
                end_time,
                break_start_time,
                break_end_time,
                slot_duration_minutes = 30,
                max_appointments_per_slot = 1,
                buffer_time_minutes = 0,
                availability_type = 'regular',
                valid_from,
                valid_to
            } = availabilityData;

            // Validate required fields
            if (!staff_id || day_of_week === undefined || !start_time || !end_time) {
                throw new Error('Missing required fields: staff_id, day_of_week, start_time, end_time');
            }

            // Validate day_of_week (0-6)
            if (day_of_week < 0 || day_of_week > 6) {
                throw new Error('day_of_week must be between 0 (Sunday) and 6 (Saturday)');
            }

            const { data, error } = await supabase
                .from('staff_availability')
                .insert({
                    staff_id,
                    day_of_week,
                    start_time,
                    end_time,
                    break_start_time,
                    break_end_time,
                    slot_duration_minutes,
                    max_appointments_per_slot,
                    buffer_time_minutes,
                    availability_type,
                    valid_from,
                    valid_to,
                    is_active: true
                })
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating availability:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get availability for a staff member
     * @param {string} staffId - Staff UUID
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} - Success/error result
     */
    static async getByStaff(staffId, filters = {}) {
        try {
            let query = supabase
                .from('staff_availability')
                .select('*')
                .eq('staff_id', staffId)
                .order('day_of_week', { ascending: true })
                .order('start_time', { ascending: true });

            if (filters.is_active !== undefined) {
                query = query.eq('is_active', filters.is_active);
            }
            if (filters.day_of_week !== undefined) {
                query = query.eq('day_of_week', filters.day_of_week);
            }
            if (filters.availability_type) {
                query = query.eq('availability_type', filters.availability_type);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching staff availability:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update availability slot
     * @param {string} availabilityId - Availability UUID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} - Success/error result
     */
    static async update(availabilityId, updateData) {
        try {
            const { data, error } = await supabase
                .from('staff_availability')
                .update(updateData)
                .eq('id', availabilityId)
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating availability:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete availability slot
     * @param {string} availabilityId - Availability UUID
     * @returns {Promise<Object>} - Success/error result
     */
    static async delete(availabilityId) {
        try {
            const { error } = await supabase
                .from('staff_availability')
                .delete()
                .eq('id', availabilityId);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Error deleting availability:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Toggle availability active status
     * @param {string} availabilityId - Availability UUID
     * @param {boolean} isActive - Active status
     * @returns {Promise<Object>} - Success/error result
     */
    static async toggleActive(availabilityId, isActive) {
        try {
            const { data, error } = await supabase
                .from('staff_availability')
                .update({ is_active: isActive })
                .eq('id', availabilityId)
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error toggling availability:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all active availability for booking
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} - Success/error result
     */
    static async getActiveAvailability(filters = {}) {
        try {
            let query = supabase
                .from('staff_availability')
                .select(`
                    *,
                    staff:staff_id(name, email, staff_id, department, role)
                `)
                .eq('is_active', true)
                .order('day_of_week', { ascending: true })
                .order('start_time', { ascending: true });

            if (filters.day_of_week !== undefined) {
                query = query.eq('day_of_week', filters.day_of_week);
            }
            if (filters.availability_type) {
                query = query.eq('availability_type', filters.availability_type);
            }
            if (filters.staff_role) {
                query = query.eq('staff.role', filters.staff_role);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching active availability:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get available staff for a specific date and time
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} startTime - Start time in HH:MM format
     * @param {string} endTime - End time in HH:MM format
     * @param {string} role - Optional staff role filter
     * @param {string} availabilityType - Optional availability type filter (e.g. emergency)
     * @returns {Promise<Object>} - Success/error result
     */
    static async getAvailableStaff(date, startTime, endTime, role = null, availabilityType = null) {
        try {
            const dayOfWeek = new Date(date).getDay();

            let query = supabase
                .from('staff_availability')
                .select(`
                    *,
                    staff:staff_id(name, email, staff_id, department, role)
                `)
                .eq('is_active', true)
                .eq('day_of_week', dayOfWeek)
                .lte('start_time', startTime)
                .gte('end_time', endTime);

            if (role) {
                query = query.eq('staff.role', role);
            }
            if (availabilityType) {
                query = query.eq('availability_type', availabilityType);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Filter out staff with exceptions on this date
            const availableStaff = [];
            for (const availability of data) {
                const hasException = await this.hasExceptionOnDate(availability.staff_id, date);
                if (!hasException) {
                    availableStaff.push(availability);
                }
            }

            return { success: true, data: availableStaff };
        } catch (error) {
            console.error('Error fetching available staff:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if staff has exception on specific date
     * @param {string} staffId - Staff UUID
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Promise<boolean>} - Whether staff has exception
     */
    static async hasExceptionOnDate(staffId, date) {
        try {
            const { data, error } = await supabase
                .from('availability_exceptions')
                .select('id')
                .eq('staff_id', staffId)
                .eq('exception_date', date)
                .eq('exception_type', 'unavailable')
                .limit(1);

            if (error) throw error;
            return data.length > 0;
        } catch (error) {
            console.error('Error checking staff exception:', error);
            return false;
        }
    }

    /**
     * Bulk create availability slots
     * @param {string} staffId - Staff UUID
     * @param {Array} slots - Array of availability slots
     * @returns {Promise<Object>} - Success/error result
     */
    static async bulkCreate(staffId, slots) {
        try {
            const availabilityData = slots.map(slot => ({
                staff_id: staffId,
                ...slot
            }));

            const { data, error } = await supabase
                .from('staff_availability')
                .insert(availabilityData)
                .select('*');

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error bulk creating availability:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get availability summary for staff
     * @param {string} staffId - Staff UUID
     * @returns {Promise<Object>} - Success/error result
     */
    static async getSummary(staffId) {
        try {
            const { data, error } = await supabase
                .from('staff_availability')
                .select('day_of_week, is_active, availability_type')
                .eq('staff_id', staffId);

            if (error) throw error;

            const summary = {
                total_slots: data.length,
                active_slots: data.filter(slot => slot.is_active).length,
                days_covered: [...new Set(data.map(slot => slot.day_of_week))].length,
                availability_types: [...new Set(data.map(slot => slot.availability_type))]
            };

            return { success: true, data: summary };
        } catch (error) {
            console.error('Error fetching availability summary:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = StaffAvailability;