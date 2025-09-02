const { supabase } = require('../config/database');

class Appointment {
    static async create({ student_id, lecturer_id, appointment_time, reason, status, location = null, meeting_type = 'in_person', meeting_link = null }) {
        try {
            const insertData = { student_id, lecturer_id, appointment_time, reason, location, meeting_type, meeting_link };
            if (status) insertData.status = status;
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

    static async listByStudent(studentId) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('student_id', studentId)
                .order('appointment_time', { ascending: true });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async listByLecturer(lecturerId) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .select('*')
                .eq('lecturer_id', lecturerId)
                .order('appointment_time', { ascending: true });
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    static async update(id, updateData) {
        // Filter allowed fields for update
        const allowedFields = ['appointment_time', 'reason', 'status', 'location', 'meeting_type', 'meeting_link'];
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
     * Find upcoming appointments for a user (student or lecturer)
     * @param {number} userId
     * @param {string} role - 'student' or 'lecturer'
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
                    student:users!appointments_student_id_fkey(id, name, profile_picture),
                    lecturer:users!appointments_lecturer_id_fkey(id, name, profile_picture)
                `)
                .gte('appointment_time', now)
                .order('appointment_time', { ascending: true })
                .range(from, to);

            if (role === 'student') {
                query = query.eq('student_id', userId);
            } else if (role === 'lecturer') {
                query = query.eq('lecturer_id', userId);
            } else {
                return { success: false, error: 'Invalid role specified' };
            }

            const { data, error } = await query;

            if (error) throw error;

            const formattedAppointments = data.map(appt => ({
                ...appt,
                student: appt.student,
                lecturer: appt.lecturer
            }));

            return { success: true, data: formattedAppointments };
        } catch (error) {
            return { success: false, error: error.message };
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
            if (appt.student_id !== byUserId && appt.lecturer_id !== byUserId) {
                return { success: false, error: 'Not authorized to cancel this appointment' };
            }
            const { data, error } = await supabase
                .from('appointments')
                .update({ status: 'declined' })
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

