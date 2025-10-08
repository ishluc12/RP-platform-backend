const { createClient } = require('@supabase/supabase-js');
const { logger } = require('../utils/logger');

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

class Appointment {
    /**
     * List appointments by appointee (staff)
     * @param {string} appointeeId - Staff ID
     * @param {Object} options - Filter options
     * @returns {Promise<Object>} - Success/error result
     */
    static async listByAppointee(appointeeId, options = {}) {
        try {
            const { status, limit = 10, offset = 0, orderBy = 'appointment_date', orderDirection = 'asc' } = options;

            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    requester:requester_id(id, name, email, role, profile_picture),
                    appointee:appointee_id(id, name, email, role, profile_picture)
                `)
                .eq('appointee_id', appointeeId)
                .order(orderBy, { ascending: orderDirection === 'asc' })
                .range(offset, offset + limit - 1);

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) {
                logger.error('Error listing appointments by appointee:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (error) {
            logger.error('Error in listByAppointee:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Find upcoming appointments for a user
     * @param {string} userId - User ID
     * @param {string} role - User role ('student' or 'staff')
     * @param {Object} options - Filter options
     * @returns {Promise<Object>} - Success/error result
     */
    static async getUpcomingByUser(userId, role = 'student', options = {}) {
        try {
            const { limit = 5, offset = 0 } = options;
            const today = new Date().toISOString().split('T')[0];

            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    requester:requester_id(id, name, email, role, profile_picture),
                    appointee:appointee_id(id, name, email, role, profile_picture)
                `)
                .gte('appointment_date', today)
                .in('status', ['pending', 'accepted', 'rescheduled'])
                .order('appointment_date', { ascending: true })
                .order('start_time', { ascending: true })
                .range(offset, offset + limit - 1);

            if (role === 'student') {
                query = query.eq('requester_id', userId);
            } else {
                query = query.eq('appointee_id', userId);
            }

            const { data, error } = await query;

            if (error) {
                logger.error('Error finding upcoming appointments:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (error) {
            logger.error('Error in findUpcomingAppointments:', error);
            return { success: false, error: error.message };
        }
    }
    /**
     * Create a new appointment request
     * @param {Object} appointmentData - Appointment data
     * @returns {Promise<Object>} - Success/error result
     */
    static async create(appointmentData) {
        try {
            const {
                requester_id,
                appointee_id,
                appointment_date,
                start_time,
                end_time,
                duration_minutes = 30,
                appointment_type,
                priority = 'normal',
                meeting_type = 'in_person',
                location,
                meeting_link,
                reason,
                student_notes
            } = appointmentData;

            // Validate required fields
            if (!requester_id || !appointee_id || !appointment_date || !start_time || !end_time || !reason) {
                throw new Error('Missing required fields: requester_id, appointee_id, appointment_date, start_time, end_time, reason');
            }

            // Check if slot is available
            const isAvailable = await this.isSlotAvailable(appointee_id, appointment_date, start_time, end_time);
            if (!isAvailable) {
                throw new Error('Selected time slot is not available');
            }

            const { data, error } = await supabase
                .from('appointments')
                .insert({
                    requester_id,
                    appointee_id,
                    appointment_date,
                    start_time,
                    end_time,
                    duration_minutes,
                    appointment_type,
                    priority,
                    meeting_type,
                    location,
                    meeting_link,
                    reason,
                    student_notes,
                    status: 'pending'
                })
                .select('*')
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error creating appointment:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get appointment by ID with user details
     * @param {string} appointmentId - Appointment UUID
     * @returns {Promise<Object>} - Success/error result
     */
    static async getById(appointmentId) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    requester:requester_id(name, email, student_id, department),
                    appointee:appointee_id(name, email, staff_id, department, role)
                `)
                .eq('id', appointmentId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching appointment:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Update appointment status (accept/decline/reschedule/cancel)
     * @param {string} appointmentId - Appointment UUID
     * @param {Object} updateData - Update data
     * @returns {Promise<Object>} - Success/error result
     */
    static async updateStatus(appointmentId, updateData) {
        try {
            const {
                status,
                response_message,
                staff_notes,
                new_appointment_date,
                new_start_time,
                new_end_time
            } = updateData;

            // Get current appointment
            const currentAppointment = await this.getById(appointmentId);
            if (!currentAppointment.success) {
                throw new Error('Appointment not found');
            }

            const appointment = currentAppointment.data;

            // Prepare update data
            const updatePayload = {
                status,
                responded_at: new Date().toISOString(),
                response_message,
                staff_notes
            };

            // Handle rescheduling
            if (status === 'rescheduled' && new_appointment_date && new_start_time && new_end_time) {
                // Check if new slot is available
                const isAvailable = await this.isSlotAvailable(
                    appointment.appointee_id,
                    new_appointment_date,
                    new_start_time,
                    new_end_time
                );
                if (!isAvailable) {
                    throw new Error('New time slot is not available');
                }

                updatePayload.appointment_date = new_appointment_date;
                updatePayload.start_time = new_start_time;
                updatePayload.end_time = new_end_time;
            }

            const { data, error } = await supabase
                .from('appointments')
                .update(updatePayload)
                .eq('id', appointmentId)
                .select('*')
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error updating appointment status:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get appointments for a user (as requester or appointee)
     * @param {string} userId - User UUID
     * @param {string} role - 'requester' or 'appointee'
     * @param {Object} filters - Optional filters
     * @returns {Promise<Object>} - Success/error result
     */
    static async getByUser(userId, role = 'both', filters = {}) {
        try {
            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    requester:requester_id(name, email, student_id, department),
                    appointee:appointee_id(name, email, staff_id, department, role)
                `)
                .order('appointment_date', { ascending: true })
                .order('start_time', { ascending: true });

            // Filter by role
            if (role === 'requester') {
                query = query.eq('requester_id', userId);
            } else if (role === 'appointee') {
                query = query.eq('appointee_id', userId);
            } else if (role === 'both') {
                query = query.or(`requester_id.eq.${userId},appointee_id.eq.${userId}`);
            }

            // Apply additional filters
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.appointment_date) {
                query = query.eq('appointment_date', filters.appointment_date);
            }
            if (filters.appointment_type) {
                query = query.eq('appointment_type', filters.appointment_type);
            }
            if (filters.priority) {
                query = query.eq('priority', filters.priority);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching user appointments:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get pending appointments for staff
     * @param {string} staffId - Staff UUID
     * @returns {Promise<Object>} - Success/error result
     */
    static async getPendingForStaff(staffId) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    requester:requester_id(name, email, student_id, department)
                `)
                .eq('appointee_id', staffId)
                .eq('status', 'pending')
                .order('appointment_date', { ascending: true })
                .order('start_time', { ascending: true });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching pending appointments:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get upcoming appointments for a user
     * @param {string} userId - User UUID
     * @param {string} role - 'requester' or 'appointee'
     * @returns {Promise<Object>} - Success/error result
     */
    static async getUpcoming(userId, role = 'both') {
        try {
            const today = new Date().toISOString().split('T')[0];

            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    requester:requester_id(name, email, student_id, department),
                    appointee:appointee_id(name, email, staff_id, department, role)
                `)
                .gte('appointment_date', today)
                .in('status', ['pending', 'accepted'])
                .order('appointment_date', { ascending: true })
                .order('start_time', { ascending: true });

            // Filter by role
            if (role === 'requester') {
                query = query.eq('requester_id', userId);
            } else if (role === 'appointee') {
                query = query.eq('appointee_id', userId);
            } else if (role === 'both') {
                query = query.or(`requester_id.eq.${userId},appointee_id.eq.${userId}`);
            }

            const { data, error } = await query;

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching upcoming appointments:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Cancel an appointment
     * @param {string} appointmentId - Appointment UUID
     * @param {string} userId - User UUID (for authorization)
     * @param {string} reason - Cancellation reason
     * @returns {Promise<Object>} - Success/error result
     */
    static async cancel(appointmentId, userId, reason) {
        try {
            // Check if user has permission to cancel
            const appointment = await this.getById(appointmentId);
            if (!appointment.success) {
                throw new Error('Appointment not found');
            }

            const appt = appointment.data;
            if (appt.requester_id !== userId && appt.appointee_id !== userId) {
                throw new Error('Unauthorized to cancel this appointment');
            }

            const { data, error } = await supabase
                .from('appointments')
                .update({
                    status: 'cancelled',
                    staff_notes: reason,
                    responded_at: new Date().toISOString()
                })
                .eq('id', appointmentId)
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error cancelling appointment:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if a time slot is available
     * @param {string} staffId - Staff UUID
     * @param {string} date - Date in YYYY-MM-DD format
     * @param {string} startTime - Start time in HH:MM format
     * @param {string} endTime - End time in HH:MM format
     * @returns {Promise<boolean>} - Whether slot is available
     */
    static async isSlotAvailable(staffId, date, startTime, endTime) {
        try {
            const { data, error } = await supabase
                .rpc('is_slot_available', {
                    p_staff_id: staffId,
                    p_date: date,
                    p_start_time: startTime,
                    p_end_time: endTime
                });

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error checking slot availability:', error);
            return false;
        }
    }

    /**
     * Get available time slots for a staff member on a specific date
     * @param {string} staffId - Staff UUID
     * @param {string} date - Date in YYYY-MM-DD format
     * @returns {Promise<Object>} - Success/error result
     */
    static async getAvailableSlots(staffId, date) {
        try {
            const { data, error } = await supabase
                .rpc('get_available_slots', {
                    p_staff_id: staffId,
                    p_date: date
                });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching available slots:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get appointment statistics for a user
     * @param {string} userId - User UUID
     * @param {string} role - 'requester' or 'appointee'
     * @returns {Promise<Object>} - Success/error result
     */
    static async getStats(userId, role = 'both') {
        try {
            let query = supabase
                .from('appointments')
                .select('status, appointment_date, created_at');

            // Filter by role
            if (role === 'requester') {
                query = query.eq('requester_id', userId);
            } else if (role === 'appointee') {
                query = query.eq('appointee_id', userId);
            } else if (role === 'both') {
                query = query.or(`requester_id.eq.${userId},appointee_id.eq.${userId}`);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Calculate statistics
            const stats = {
                total: data.length,
                pending: data.filter(a => a.status === 'pending').length,
                accepted: data.filter(a => a.status === 'accepted').length,
                declined: data.filter(a => a.status === 'declined').length,
                completed: data.filter(a => a.status === 'completed').length,
                cancelled: data.filter(a => a.status === 'cancelled').length,
                rescheduled: data.filter(a => a.status === 'rescheduled').length
            };

            return { success: true, data: stats };
        } catch (error) {
            console.error('Error fetching appointment stats:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Get appointment history for an appointment
     * @param {string} appointmentId - Appointment UUID
     * @returns {Promise<Object>} - Success/error result
     */
    static async getHistory(appointmentId) {
        try {
            const { data, error } = await supabase
                .from('appointment_history')
                .select(`
                    *,
                    changed_by_user:changed_by(name, email)
                `)
                .eq('appointment_id', appointmentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error fetching appointment history:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = Appointment;
