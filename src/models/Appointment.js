const { supabase } = require('../config/database');

class Appointment {
    static async create({ student_id, lecturer_id, appointment_time, reason, location, meeting_type = 'in_person', meeting_link }) {
        try {
            const { data, error } = await supabase
                .from('appointments')
                .insert([{ student_id, lecturer_id, appointment_time, reason, location, meeting_type, meeting_link }])
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
        try {
            const { data, error } = await supabase
                .from('appointments')
                .update(updateData)
                .eq('id', id)
                .select('*')
                .single();
            if (error) throw error;
            return { success: true, data };
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

