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
            const staffId = req.user.id;

            // Get different appointment statistics
            const [totalAppointmentsResult, pendingAppointmentsResult, upcomingAppointmentsResult, createdEventsResult] = await Promise.all([
                Appointment.getByUser(staffId, 'appointee'), // All appointments for this staff member
                Appointment.getPendingForStaff(staffId), // Only pending appointments
                Appointment.getUpcoming(staffId, 'appointee'), // Upcoming appointments
                Event.findByCreator(staffId, 1, 100, {}) // Get more events for accurate count
            ]);

            // Calculate accurate statistics
            const totalAppointments = totalAppointmentsResult.success ? totalAppointmentsResult.data.length : 0;
            const pendingAppointments = pendingAppointmentsResult.success ? pendingAppointmentsResult.data.length : 0;
            const upcomingAppointments = upcomingAppointmentsResult.success ? upcomingAppointmentsResult.data.length : 0;
            
            // Count completed and cancelled appointments separately
            let completedAppointments = 0;
            let cancelledAppointments = 0;
            
            if (totalAppointmentsResult.success && totalAppointmentsResult.data) {
                const appointments = totalAppointmentsResult.data;
                completedAppointments = appointments.filter(apt => apt.status === 'completed').length;
                cancelledAppointments = appointments.filter(apt => apt.status === 'cancelled').length;
            }
            
            const eventsCreated = createdEventsResult.success && createdEventsResult.data ? createdEventsResult.data.length : 0;

            const summary = {
                totalAppointments,
                pendingAppointments,
                upcomingAppointments,
                completedAppointments,
                cancelledAppointments,
                eventsCreated,
                totalStudents: totalAppointments > 0 ? new Set(totalAppointmentsResult.data.map(apt => apt.requester_id)).size : 0,
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
            const staffId = req.user.id;
            const limit = parseInt(req.query.limit) || 5;

            const allAppointmentsResult = await Appointment.getByUser(staffId, 'appointee');
            if (!allAppointmentsResult.success) {
                return response(res, 200, 'No appointments found', []);
            }

            // Process and enrich appointment data
            const processedAppointments = (allAppointmentsResult.data || []).map(appointment => {
                // Ensure proper date handling
                let appointmentDate = null;
                if (appointment.appointment_time) {
                    appointmentDate = new Date(appointment.appointment_time);
                } else if (appointment.appointment_date && appointment.start_time) {
                    appointmentDate = new Date(`${appointment.appointment_date}T${appointment.start_time}`);
                }

                // Extract student name from requester data
                let studentName = 'Unknown Student';
                if (appointment.requester && appointment.requester.name) {
                    studentName = appointment.requester.name;
                } else if (appointment.requester_name) {
                    studentName = appointment.requester_name;
                }

                return {
                    ...appointment,
                    studentName,
                    requesterName: studentName, // Alias for compatibility
                    appointment_time: appointmentDate ? appointmentDate.toISOString() : null,
                    displayDate: appointmentDate ? appointmentDate.toLocaleDateString() : 'Invalid Date',
                    displayTime: appointmentDate ? appointmentDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Invalid Time',
                    dayOfWeek: appointmentDate ? appointmentDate.toLocaleDateString('en-US', { weekday: 'short' }) : 'Invalid Day'
                };
            });

            // Sort by appointment time (most recent first)
            const sortedAppointments = processedAppointments.sort((a, b) => {
                if (!a.appointment_time || !b.appointment_time) return 0;
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
