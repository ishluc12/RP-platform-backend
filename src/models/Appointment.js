const { supabase } = require('../config/database');

class Appointment {
    static async create({ requester_id, appointee_id, appointment_time, duration_minutes = 30, reason, status = 'pending', location = null, meeting_type = 'in_person', meeting_link = null, priority = 'normal', appointment_type = null, notes = null }) {
        try {
            const insertData = { requester_id, appointee_id, appointment_time, duration_minutes, reason, status, location, meeting_type, meeting_link, priority, appointment_type, notes };
            const { data, error } = await supabase
                .from('appointments')
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
                .from('appointments')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async listByRequester(requesterId) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    requester:users!requester_id(id, name, email),
                    appointee:users!appointee_id(id, name, email)
                `)
                .eq('requester_id', requesterId)
                .order('appointment_time', { ascending: true });
            if (error) throw error;

            // Format appointments to include appointee information
            const formattedAppointments = data.map(appt => ({
                ...appt,
                appointee_name: appt.appointee?.name || 'Unknown Lecturer',
                appointee_email: appt.appointee?.email || '',
                requester: appt.requester,
                appointee: appt.appointee
            }));

            return { success: true, data: formattedAppointments };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async listByAppointee(appointeeId) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select(`
                    *,
                    requester:users!requester_id(id, name, email),
                    appointee:users!appointee_id(id, name, email)
                `)
                .eq('appointee_id', appointeeId)
                .order('appointment_time', { ascending: true });
            if (error) throw error;

            // Format appointments to include requester information
            const formattedAppointments = data.map(appt => ({
                ...appt,
                student_name: appt.requester?.name || 'Unknown Student',
                student_email: appt.requester?.email || '',
                requester: appt.requester,
                appointee: appt.appointee
            }));

            return { success: true, data: formattedAppointments };
        } catch (error) {
            console.error('Error in Appointment.listByAppointee:', error.message); // Add detailed logging
            return { success: false, error: error.message };
        }
    }

    static async update(id, updateData) {
        // Filter allowed fields for update
        const allowedFields = ['appointment_time', 'duration_minutes', 'reason', 'status', 'location', 'meeting_type', 'meeting_link', 'priority', 'appointment_type', 'notes'];
        const filteredUpdate = {};
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) filteredUpdate[field] = updateData[field];
        });

        try {
            const { data, error } = await supabase
                .from('appointments')
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

    /**
     * Find upcoming appointments for a user (student or staff)
     * @param {string} userId - UUID of the user
     * @param {string} role - 'student' or 'staff'
     * @param {Object} [options={}]
     * @param {number} [options.page=1]
     * @param {number} [options.limit=10]
     * @returns {Promise<Object>}
     */
    static async findUpcomingAppointments(userId, role, { page = 1, limit = 10 } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;
            const now = new Date().toISOString();

            let query = supabase
                .from('appointments')
                .select(`
                    *,
                    requester:users!requester_id(id, name),
                    appointee:users!appointee_id(id, name)
                `)
                .gte('appointment_time', now)
                .order('appointment_time', { ascending: true })
                .range(from, to);

            if (role === 'requester') {
                query = query.eq('requester_id', String(userId));
            } else if (role === 'appointee') {
                query = query.eq('appointee_id', String(userId));
            } else {
                return { success: false, error: 'Invalid role specified' };
            }

            const { data, error } = await query;

            if (error) throw error;

            const formattedAppointments = data.map(appt => ({
                ...appt,
                requester: appt.requester,
                appointee: appt.appointee
            }));

            return { success: true, data: formattedAppointments };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all appointments with pagination and optional filters
     * @param {number} [page=1]
     * @param {number} [limit=10]
     * @param {Object} [filters={}]
     * @returns {Promise<Object>}
     */
    static async findAll(page = 1, limit = 10, filters = {}) {
        try {
            let query = supabase.from('appointments').select('*', { count: 'exact' }).order('created_at', { ascending: false });

            // Apply filters
            if (filters.status) {
                query = query.eq('status', filters.status);
            }
            if (filters.requester_id) {
                query = query.eq('requester_id', filters.requester_id);
            }
            if (filters.appointee_id) {
                query = query.eq('appointee_id', filters.appointee_id);
            }
            if (filters.appointment_time_from) {
                query = query.gte('appointment_time', filters.appointment_time_from);
            }
            if (filters.appointment_time_to) {
                query = query.lte('appointment_time', filters.appointment_time_to);
            }

            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error, count } = await query.range(from, to);
            if (error) throw error;

            return {
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    static async cancel(id, byUserId) {
        try {
            const { data: appt, error: findErr } = await supabase
                .from('appointments')
                .select('*')
                .eq('id', id)
                .single();
            if (findErr) throw findErr;
            if (appt.requester_id !== byUserId && appt.appointee_id !== byUserId) {
                return { success: false, error: 'Not authorized to cancel this appointment' };
            }
            const { data, error } = await supabase
                .from('appointments')
                .update({ status: 'cancelled' })
                .eq('id', id)
                .select('*')
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = Appointment;

