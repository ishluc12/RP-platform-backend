const Appointment = require('../../models/Appointment');
const Event = require('../../models/Event');
const User = require('../../models/User');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class AdministratorDashboardController {
    /**
     * Get a summary of key metrics for the administrator dashboard.
     */
    static async getDashboardSummary(req, res) {
        try {
            const adminId = req.user.id;

            const [totalAppointmentsResult, upcomingAppointmentsResult, createdEventsResult, upcomingEventsResult] = await Promise.all([
                Appointment.getByUser(adminId, 'appointee'),
                Appointment.getUpcoming(adminId, 'appointee'),
                Event.findByCreator(adminId, 1, 1, {}),
                Event.findAll(1, 1, { created_by: adminId, event_date_from: new Date().toISOString() })
            ]);

            const summary = {
                totalAppointments: totalAppointmentsResult.success ? totalAppointmentsResult.data.length : 0,
                upcomingAppointments: upcomingAppointmentsResult.success ? upcomingAppointmentsResult.data.length : 0,
                totalCreatedEvents: createdEventsResult.pagination ? createdEventsResult.pagination.total : 0,
                upcomingCreatedEvents: upcomingEventsResult.pagination ? upcomingEventsResult.pagination.total : 0,
                generatedAt: new Date().toISOString()
            };

            response(res, 200, 'Administrator dashboard summary retrieved successfully', summary);
        } catch (error) {
            logger.error('Error fetching administrator dashboard summary:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get a list of recent and upcoming appointments for the administrator.
     */
    static async getRecentAppointments(req, res) {
        try {
            const adminId = req.user.id;
            const limit = parseInt(req.query.limit) || 5;

            const allAppointmentsResult = await Appointment.getByUser(adminId, 'appointee');
            if (!allAppointmentsResult.success) throw new Error(allAppointmentsResult.error);

            const sortedAppointments = (allAppointmentsResult.data || []).sort((a, b) => {
                return new Date(b.appointment_time).getTime() - new Date(a.appointment_time).getTime();
            });

            response(res, 200, 'Recent appointments retrieved successfully', sortedAppointments.slice(0, limit));
        } catch (error) {
            logger.error('Error fetching recent administrator appointments:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get a list of students the administrator has recently interacted with (e.g., via appointments).
     */
    static async getRecentStudents(req, res) {
        try {
            const adminId = req.user.id;
            const limit = parseInt(req.query.limit) || 5;

            const allAppointmentsResult = await Appointment.getByUser(adminId, 'appointee');
            if (!allAppointmentsResult.success) throw new Error(allAppointmentsResult.error);

            const studentIds = [...new Set((allAppointmentsResult.data || []).map(appt => appt.requester_id))];

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
                
                // Find the most recent appointment with this student to get last interaction date
                const studentAppointments = (allAppointmentsResult.data || []).filter(appt => appt.requester_id === studentId);
                let lastInteractionDate = null;
                
                if (studentAppointments.length > 0) {
                    // Sort by most recent appointment
                    studentAppointments.sort((a, b) => {
                        const dateA = new Date(a.appointment_time || a.created_at);
                        const dateB = new Date(b.appointment_time || b.created_at);
                        return dateB.getTime() - dateA.getTime();
                    });
                    
                    const mostRecentAppointment = studentAppointments[0];
                    lastInteractionDate = new Date(mostRecentAppointment.appointment_time || mostRecentAppointment.created_at);
                }
                
                return {
                    id: userResult.data.id,
                    name: userResult.data.name,
                    profile_picture: userResult.data.profile_picture,
                    email: userResult.data.email,
                    lastInteractionDate: lastInteractionDate ? lastInteractionDate.toISOString() : null,
                    lastInteractionText: lastInteractionDate ? lastInteractionDate.toLocaleDateString() : 'No recent interaction',
                    __lastInteractionText: lastInteractionDate ? lastInteractionDate.toLocaleDateString() : 'No recent interaction'
                };
            }));

            response(res, 200, 'Recent students retrieved successfully', recentStudentsDetails.filter(Boolean));
        } catch (error) {
            logger.error('Error fetching recent students for administrator:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = AdministratorDashboardController;
