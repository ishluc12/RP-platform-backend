const Appointment = require('../../models/Appointment');
const Event = require('../../models/Event');
const User = require('../../models/User');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class StaffDashboardController { // Renamed class
    /**
     * Get a summary of key metrics for the staff dashboard.
     */
    static async getDashboardSummary(req, res) {
        try {
            const staffId = req.user.id; // Renamed lecturerId to staffId

            const [totalAppointmentsResult, upcomingAppointmentsResult, createdEventsResult, upcomingEventsResult] = await Promise.all([
                Appointment.getByUser(staffId, 'appointee'), // Use existing getByUser method
                Appointment.getUpcoming(staffId, 'appointee'), // Use existing getUpcoming method
                Event.findByCreator(staffId, 1, 1, {}),
                Event.findAll(1, 1, { created_by: staffId, event_date_from: new Date().toISOString() })
            ]);

            const summary = {
                totalAppointments: totalAppointmentsResult.success ? totalAppointmentsResult.data.length : 0,
                upcomingAppointments: upcomingAppointmentsResult.success ? upcomingAppointmentsResult.data.length : 0,
                totalCreatedEvents: createdEventsResult.pagination ? createdEventsResult.pagination.total : 0,
                upcomingCreatedEvents: upcomingEventsResult.pagination ? upcomingEventsResult.pagination.total : 0,
                generatedAt: new Date().toISOString()
            };

            response(res, 200, 'Staff dashboard summary retrieved successfully', summary);
        } catch (error) {
            logger.error('Error fetching staff dashboard summary:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get a list of recent and upcoming appointments for the staff member.
     */
    static async getRecentAppointments(req, res) {
        try {
            const staffId = req.user.id; // Renamed lecturerId to staffId
            const limit = parseInt(req.query.limit) || 5;

            const allAppointmentsResult = await Appointment.getByUser(staffId, 'appointee'); // Use existing getByUser method
            if (!allAppointmentsResult.success) throw new Error(allAppointmentsResult.error);

            const sortedAppointments = (allAppointmentsResult.data || []).sort((a, b) => {
                return new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime();
            });

            response(res, 200, 'Recent appointments retrieved successfully', sortedAppointments.slice(0, limit));
        } catch (error) {
            logger.error('Error fetching recent staff appointments:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get a list of students the staff member has recently interacted with (e.g., via appointments).
     */
    static async getRecentStudents(req, res) {
        try {
            const staffId = req.user.id; // Renamed lecturerId to staffId
            const limit = parseInt(req.query.limit) || 5;

            const allAppointmentsResult = await Appointment.getByUser(staffId, 'appointee'); // Use existing getByUser method
            if (!allAppointmentsResult.success) throw new Error(allAppointmentsResult.error);

            const studentIds = [...new Set((allAppointmentsResult.data || []).map(appt => appt.requester_id))]; // Changed student_id to requester_id

            const recentStudentsDetails = await Promise.all(studentIds.slice(0, limit).map(async studentId => {
                if (!studentId) {
                    logger.warn('Encountered null or undefined studentId in recent students list.');
                    return null;
                }
                const userResult = await User.findById(studentId);
                if (!userResult.success) {
                    logger.error(`Failed to find user with ID ${studentId}:`, userResult.error);
                    return null;
                }
                return {
                    id: userResult.data.id,
                    name: userResult.data.name,
                    profile_picture: userResult.data.profile_picture,
                    email: userResult.data.email
                };
            }));

            response(res, 200, 'Recent students retrieved successfully', recentStudentsDetails.filter(Boolean));
        } catch (error) {
            logger.error('Error fetching recent students for staff:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = StaffDashboardController; // Renamed class export
