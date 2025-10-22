const { supabase } = require('../config/database');
const { getTodayString } = require('../utils/dateUtils');

class Appointment {
    /**
     * List all appointments with pagination and optional filters
     * Mirrors the signature used by other models so controllers (e.g., admin dashboard)
     * can call Appointment.findAll(page, limit, filters)
     */
    static async findAll(page = 1, limit = 10, filters = {}) {
        try {
            let query = supabase
                .from('appointments')
                .select('*', { count: 'exact' });

            if (filters.status) query = query.eq('status', filters.status);
            if (filters.requester_id) query = query.eq('requester_id', filters.requester_id);
            if (filters.appointee_id) query = query.eq('appointee_id', filters.appointee_id);
            if (filters.date_from) query = query.gte('appointment_date', filters.date_from);
            if (filters.date_to) query = query.lte('appointment_date', filters.date_to);

            const from = (page - 1) * limit;
            const to = from + limit - 1;
            const { data, error, count } = await query
                .order('appointment_date', { ascending: false })
                .order('start_time', { ascending: false })
                .range(from, to);

            if (error) {
                logger.error('Error fetching appointments (findAll):', error);
                return { success: false, error: error.message };
            }

            return {
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total: count || 0,
                    totalPages: count ? Math.ceil(count / limit) : 0,
                },
            };
        } catch (error) {
            logger.error('Error in Appointment.findAll:', error);
            return { success: false, error: error.message };
        }
    }

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
    /**
     * Create a new appointment request
     * @param {Object} appointmentData - Appointment data
     * @returns {Promise<Object>} - Success/error result
     */
    static async create(appointmentData) {
        try {
            // Create appointment_time using local timezone to avoid timezone shifts
            // Format: YYYY-MM-DDTHH:mm:ss (local time)
            const appointmentTime = `${appointmentData.appointment_date}T${appointmentData.start_time}`;
            
            const { data, error } = await supabase
                .from('appointments')
                .insert([{
                    ...appointmentData,
                    appointment_time: appointmentTime,
                    requested_at: new Date().toISOString()
                }])
                .select('*')
                .single();

            if (error) throw error;

            // Fetch user details separately
            const { data: requesterData } = await supabase
                .from('users')
                .select('id, name, email, student_id, role')
                .eq('id', data.requester_id)
                .single();

            const { data: appointeeData } = await supabase
                .from('users')
                .select('id, name, email, staff_id, department, role')
                .eq('id', data.appointee_id)
                .single();

            const enrichedData = {
                ...data,
                requester: requesterData,
                appointee: appointeeData
            };

            return { success: true, data: enrichedData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get appointment by ID
     */
    static async getById(appointmentId) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    requester:requester_id(id, name, email, student_id, role),
                    appointee:appointee_id(id, name, email, staff_id, department, role)
                `)
                .eq('id', appointmentId)
                .is('deleted_at', null)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get appointments by user
     */
    static async getByUser(userId, userType = 'requester', filters = {}) {
        try {
            const field = userType === 'requester' ? 'requester_id' : 'appointee_id';

            let query = supabase
                .from('appointments')
                .select('*')
                .eq(field, userId)
                .is('deleted_at', null);

            if (filters.status) {
                query = query.eq('status', filters.status);
            }

            if (filters.appointment_type) {
                query = query.eq('appointment_type', filters.appointment_type);
            }

            if (filters.priority) {
                query = query.eq('priority', filters.priority);
            }

            if (filters.start_date) {
                query = query.gte('appointment_date', filters.start_date);
            }

            if (filters.end_date) {
                query = query.lte('appointment_date', filters.end_date);
            }

            const { data, error } = await query.order('appointment_date', { ascending: true });

            if (error) throw error;

            // Enrich with user details
            const enrichedData = await Promise.all((data || []).map(async (appointment) => {
                const { data: requesterData } = await supabase
                    .from('users')
                    .select('id, name, email, student_id, role')
                    .eq('id', appointment.requester_id)
                    .single();

                const { data: appointeeData } = await supabase
                    .from('users')
                    .select('id, name, email, staff_id, department, role')
                    .eq('id', appointment.appointee_id)
                    .single();

                return {
                    ...appointment,
                    requester: requesterData,
                    appointee: appointeeData
                };
            }));

            return { success: true, data: enrichedData };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get pending appointments for staff
     */
    static async getPendingForStaff(staffId) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    requester:requester_id(id, name, email, student_id, role),
                    appointee:appointee_id(id, name, email, staff_id, department, role)
                `)
                .eq('appointee_id', staffId)
                .eq('status', 'pending')
                .is('deleted_at', null)
                .order('appointment_date', { ascending: true });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get upcoming appointments with pagination support
     */
    static async findUpcomingAppointments(userId, userType = 'requester', options = {}) {
        try {
            const { page = 1, limit = 10 } = options;
            const field = userType === 'requester' ? 'requester_id' : 'appointee_id';
            const today = getTodayString(); // Fix: Use local timezone date

            // Calculate offset for pagination
            const offset = (page - 1) * limit;

            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    requester:requester_id(id, name, email, student_id, role),
                    appointee:appointee_id(id, name, email, staff_id, department, role)
                `)
                .eq(field, userId)
                .gte('appointment_date', today)
                .in('status', ['pending', 'accepted'])
                .is('deleted_at', null)
                .order('appointment_date', { ascending: true })
                .order('start_time', { ascending: true })
                .range(offset, offset + limit - 1);

            if (error) throw error;
            
            return { 
                success: true, 
                data: data || [],
                pagination: {
                    page,
                    limit,
                    total: data ? data.length : 0
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get upcoming appointments
     */
    static async getUpcoming(userId, userType = 'requester') {
        try {
            const field = userType === 'requester' ? 'requester_id' : 'appointee_id';
            const today = getTodayString();

            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq(field, userId)
                .gte('appointment_date', today)
                .in('status', ['pending', 'accepted'])
                .is('deleted_at', null)
                .order('appointment_date', { ascending: true })
                .order('start_time', { ascending: true });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all appointments (for sys-admin)
     */
    static async getAll(filters = {}) {
        try {
            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    requester:requester_id(id, name, email, student_id, role),
                    appointee:appointee_id(id, name, email, staff_id, department, role)
                `)
                .is('deleted_at', null);

            if (filters.status) query = query.eq('status', filters.status);
            if (filters.appointment_type) query = query.eq('appointment_type', filters.appointment_type);
            if (filters.priority) query = query.eq('priority', filters.priority);
            if (filters.requester_id) query = query.eq('requester_id', filters.requester_id);
            if (filters.appointee_id) query = query.eq('appointee_id', filters.appointee_id);
            if (filters.start_date) query = query.gte('appointment_date', filters.start_date);
            if (filters.end_date) query = query.lte('appointment_date', filters.end_date);

            const { data, error } = await query
                .order('appointment_date', { ascending: false })
                .limit(filters.limit || 50);

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all pending appointments (sys-admin)
     */
    static async getAllPending() {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    requester:requester_id(id, name, email, student_id, role),
                    appointee:appointee_id(id, name, email, staff_id, department, role)
                `)
                .eq('status', 'pending')
                .is('deleted_at', null)
                .order('appointment_date', { ascending: true });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Update appointment status
     */
    static async updateStatus(appointmentId, statusData) {
        try {
            const updates = {
                ...statusData,
                updated_at: new Date().toISOString()
            };

            if (statusData.status === 'accepted' || statusData.status === 'declined' || statusData.status === 'rescheduled') {
                updates.responded_at = new Date().toISOString();
            }

            if (statusData.status === 'completed') {
                updates.completed_at = new Date().toISOString();
            }

            if (statusData.status === 'cancelled') {
                updates.cancelled_at = new Date().toISOString();
            }

            const { data, error } = await supabase
                .from('appointments')
                .update(updates)
                .eq('id', appointmentId)
                .select(`
                    *,
                    requester:requester_id(id, name, email, student_id, role),
                    appointee:appointee_id(id, name, email, staff_id, department, role)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Update appointment
     */
    static async update(appointmentId, updates) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', appointmentId)
                .select(`
                    *,
                    requester:requester_id(id, name, email, student_id, role),
                    appointee:appointee_id(id, name, email, staff_id, department, role)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Check if slot is available
     */
    static async isSlotAvailable(staffId, date, startTime, endTime, excludeAppointmentId = null) {
        try {
            // First, check if staff has availability for this date/time
            // Use string comparison to avoid timezone issues
            const appointmentDateStr = date; // Already a YYYY-MM-DD string from frontend
            
            const { data: availabilitySlots, error: availError } = await supabase
                .from('staff_availability')
                .select('*')
                .eq('staff_id', staffId)
                .eq('is_active', true)
                .eq('specific_date', appointmentDateStr)
                .lte('start_time', startTime)
                .gte('end_time', endTime);

            if (availError) {
                console.error('Error checking availability:', availError);
                return false;
            }

            // Check if valid_from and valid_to constraints are met
            const validSlots = availabilitySlots.filter(slot => {
                const validFrom = slot.valid_from ? slot.valid_from : null;
                const validTo = slot.valid_to ? slot.valid_to : null;
                
                // Use string comparison for date validation to avoid timezone issues
                if (validFrom) {
                    // Compare as strings (YYYY-MM-DD format)
                    if (appointmentDateStr < validFrom) return false;
                }
                
                if (validTo) {
                    // Compare as strings (YYYY-MM-DD format)
                    if (appointmentDateStr > validTo) return false;
                }
                
                return true;
            });

            if (validSlots.length === 0) {
                console.log('No availability slot found for:', { staffId, date: appointmentDateStr, startTime, endTime });
                return false;
            }

            // Check for overlapping appointments
            let query = supabase
                .from('appointments')
                .select('id')
                .eq('appointee_id', staffId)
                .eq('appointment_date', appointmentDateStr)
                .in('status', ['pending', 'accepted', 'rescheduled'])
                .is('deleted_at', null);

            // Check for time overlap: new slot overlaps if it starts before existing ends AND ends after existing starts
            query = query.or(`and(start_time.lt.${endTime},end_time.gt.${startTime})`);

            if (excludeAppointmentId) {
                query = query.neq('id', excludeAppointmentId);
            }

            const { data, error } = await query;

            if (error) throw error;
            
            // If no overlapping appointments found, slot is available
            return data.length === 0;
        } catch (error) {
            console.error('Error checking slot availability:', error);
            return false;
        }
    }

    /**
     * Get available slots for staff on a date
     */
    static async getAvailableSlots(staffId, date) {
        try {
            // This method is handled by the controller using StaffAvailability model
            // Return empty array as fallback - controller should use StaffAvailability.getByStaff instead
            return { success: true, data: [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get appointment statistics
     */
    static async getStats(userId, userType = 'requester') {
        try {
            const field = userType === 'requester' ? 'requester_id' : 'appointee_id';

            const { data, error } = await supabase
                .from('appointments')
                .select('status')
                .eq(field, userId)
                .is('deleted_at', null);

            if (error) throw error;

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
            return { success: false, error: error.message };
        }
    }

    /**
     * Get appointment history
     */
    static async getHistory(appointmentId) {
        try {
            const { data, error } = await supabase
                .from('appointment_history')
                .select(`
                    *,
                    changed_by_user:changed_by(id, name, email, role)
                `)
                .eq('appointment_id', appointmentId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Soft delete appointment
     */
    static async softDelete(appointmentId) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .update({
                    deleted_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', appointmentId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Hard delete appointment (sys-admin only)
     */
    static async hardDelete(appointmentId, details) {
        try {
            const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', appointmentId);

            if (error) throw error;
            return { success: true, message: 'Appointment permanently deleted' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
    static async cancel(appointmentId, staffId, reason) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .update({
                    status: 'cancelled',
                    cancellation_reason: reason,
                    cancelled_by: staffId,
                    cancelled_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                })
                .eq('id', appointmentId)
                .select(`
                    *,
                    requester:requester_id(id, name, email, student_id, role),
                    appointee:appointee_id(id, name, email, staff_id, department, role)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }


    /**
     * Count appointments
     */
    static async count(filters = {}) {
        try {
            let query = supabase
                .from('appointments')
                .select('id', { count: 'exact', head: true })
                .is('deleted_at', null);
            if (filters.status) query = query.eq('status', filters.status);

            const { count, error } = await query;

            if (error) throw error;
            return { success: true, data: count };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Find all appointments with pagination (for admin use)
     */
    static async findAll(page = 1, limit = 10, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            
            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    requester:requester_id(id, name, email, student_id, role),
                    appointee:appointee_id(id, name, email, staff_id, department, role)
                `, { count: 'exact' })
                .is('deleted_at', null);

            // Apply filters
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.appointment_type) {
                query = query.eq('appointment_type', filters.appointment_type);
            }
            if (filters.priority) {
                query = query.eq('priority', filters.priority);
            }
            if (filters.requester_id) {
                query = query.eq('requester_id', filters.requester_id);
            }
            if (filters.appointee_id) {
                query = query.eq('appointee_id', filters.appointee_id);
            }
            if (filters.start_date || filters.appointment_date_from) {
                const startDate = filters.start_date || filters.appointment_date_from;
                query = query.gte('appointment_date', startDate);
            }
            if (filters.end_date || filters.appointment_date_to) {
                const endDate = filters.end_date || filters.appointment_date_to;
                query = query.lte('appointment_date', endDate);
            }
            if (filters.appointment_time_from) {
                query = query.gte('appointment_time', filters.appointment_time_from);
            }
            if (filters.appointment_time_to) {
                query = query.lte('appointment_time', filters.appointment_time_to);
            }
            if (filters.created_after) {
                query = query.gte('created_at', filters.created_after);
            }
            if (filters.role && filters.role === 'student') {
                // Filter appointments where requester is a student
                query = query.not('requester_id', 'is', null);
            }
            if (filters.role && filters.role === 'lecturer') {
                // Filter appointments where appointee is a lecturer
                query = query.not('appointee_id', 'is', null);
            }

            // Apply sorting
            const sortBy = filters.sortBy || 'appointment_date';
            const sortOrder = filters.sortOrder === 'desc' ? false : true;
            query = query.order(sortBy, { ascending: sortOrder });

            // Apply pagination
            query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;

            if (error) throw error;

            const totalPages = Math.ceil(count / limit);

            return {
                success: true,
                data: data || [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: count || 0,
                    totalPages,
                    hasNext: page < totalPages,
                    hasPrev: page > 1
                }
            };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Alias methods for backward compatibility
    static async getUpcomingByUser(userId, userType = 'requester') {
        return this.getUpcoming(userId, userType);
    }

    static async getByAppointee(appointeeId, filters = {}) {
        return this.getByUser(appointeeId, 'appointee', filters);
    }

    static async getByAppointeeAndStatus(appointeeId, status) {
        return this.getByUser(appointeeId, 'appointee', { status });
    }

    static async listByAppointee(appointeeId, filters = {}) {
        return this.getByUser(appointeeId, 'appointee', filters);
    }

    static async getUpcomingForLecturer(lecturerId) {
        return this.getUpcoming(lecturerId, 'appointee');
    }
}

module.exports = Appointment;