const Appointment = require('../../models/Appointment');
const Event = require('../../models/Event');
const User = require('../../models/User');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class LecturerDashboardController {
    /**
     * Get a summary of key metrics for the lecturer dashboard.
     */
    static async getDashboardSummary(req, res) {
        try {
            const lecturerId = req.user.id;

            const [totalAppointmentsResult, upcomingAppointmentsResult, createdEventsResult, upcomingEventsResult] = await Promise.all([
                Appointment.listByLecturer(lecturerId),
                Appointment.findUpcomingAppointments(lecturerId, 'lecturer'),
                Event.findByCreator(lecturerId, 1, 1, {}),
                Event.findAll(1, 1, { created_by: lecturerId, event_date_from: new Date().toISOString() })
            ]);

            const summary = {
                totalAppointments: totalAppointmentsResult.success ? totalAppointmentsResult.data.length : 0,
                upcomingAppointments: upcomingAppointmentsResult.success ? upcomingAppointmentsResult.data.length : 0,
                totalCreatedEvents: createdEventsResult.pagination ? createdEventsResult.pagination.total : 0,
                upcomingCreatedEvents: upcomingEventsResult.pagination ? upcomingEventsResult.pagination.total : 0,
                generatedAt: new Date().toISOString()
            };

            response(res, 200, 'Lecturer dashboard summary retrieved successfully', summary);
        } catch (error) {
            logger.error('Error fetching lecturer dashboard summary:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get a list of recent and upcoming appointments for the lecturer.
     */
    static async getRecentAppointments(req, res) {
        try {
            const lecturerId = req.user.id;
            const limit = parseInt(req.query.limit) || 5;

            const allAppointmentsResult = await Appointment.listByLecturer(lecturerId);
            if (!allAppointmentsResult.success) throw new Error(allAppointmentsResult.error);

            const sortedAppointments = (allAppointmentsResult.data || []).sort((a, b) => {
                return new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime();
            });

            response(res, 200, 'Recent appointments retrieved successfully', sortedAppointments.slice(0, limit));
        } catch (error) {
            logger.error('Error fetching recent lecturer appointments:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get a list of students the lecturer has recently interacted with (e.g., via appointments).
     */
    static async getRecentStudents(req, res) {
        try {
            const lecturerId = req.user.id;
            const limit = parseInt(req.query.limit) || 5;

            const allAppointmentsResult = await Appointment.listByLecturer(lecturerId);
            if (!allAppointmentsResult.success) throw new Error(allAppointmentsResult.error);

            const studentIds = [...new Set((allAppointmentsResult.data || []).map(appt => appt.student_id))];

            const recentStudentsDetails = await Promise.all(studentIds.slice(0, limit).map(async studentId => {
                const userResult = await User.findById(studentId);
                return userResult.success ? {
                    id: userResult.data.id,
                    name: userResult.data.name,
                    profile_picture: userResult.data.profile_picture,
                    email: userResult.data.email
                } : null;
            }));

            response(res, 200, 'Recent students retrieved successfully', recentStudentsDetails.filter(Boolean));
        } catch (error) {
            logger.error('Error fetching recent students for lecturer:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = LecturerDashboardController;
