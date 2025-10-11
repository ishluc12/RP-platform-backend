const { supabase } = require('../config/database');

class Appointment {
    /**
     * Create new appointment
     */
    static async create(appointmentData) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .insert([{
                    ...appointmentData,
                    requested_at: new Date().toISOString()
                }])
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
                .select(`
                    *,
                    requester:requester_id(id, name, email, student_id, role),
                    appointee:appointee_id(id, name, email, staff_id, department, role)
                `)
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
            return { success: true, data: data || [] };
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
     * Get upcoming appointments
     */
    static async getUpcoming(userId, userType = 'requester') {
        try {
            const field = userType === 'requester' ? 'requester_id' : 'appointee_id';
            const today = new Date().toISOString().split('T')[0];

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
            const { data, error } = await supabase
                .rpc('is_slot_available', {
                    p_staff_id: staffId,
                    p_date: date,
                    p_start_time: startTime,
                    p_end_time: endTime,
                    p_exclude_appointment_id: excludeAppointmentId
                });

            if (error) throw error;
            return data; // Returns boolean
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
            const { data, error } = await supabase
                .rpc('get_available_slots', {
                    p_staff_id: staffId,
                    p_date: date
                });

            if (error) throw error;
            return { success: true, data: data || [] };
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
}

module.exports = Appointment;