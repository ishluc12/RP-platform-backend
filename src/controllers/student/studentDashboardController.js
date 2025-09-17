const Appointment = require('../../models/Appointment');
const Event = require('../../models/Event');
const Post = require('../../models/Post');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class StudentDashboardController {
    /**
     * Get a summary of key metrics for the student dashboard.
     */
    static async getDashboardSummary(req, res) {
        try {
            const studentId = req.user.id;

            const [upcomingAppointmentsResult, rsvpEventsResult, myPostsResult, allEventsResult] = await Promise.allSettled([
                Appointment.findUpcomingAppointments(studentId, 'requester', { limit: 3 }),
                Event.getUserRsvpEvents(studentId, 1, 3),
                Post.findByUser(studentId, 1, 3),
                Event.findAll(1, 1) // To get total count, we can use limit 1 and check pagination.total
            ]);

            const upcomingEventsCount = (function() {
                if (rsvpEventsResult.status !== 'fulfilled' || !rsvpEventsResult.value.success) return 0;
                const now = new Date();
                return (rsvpEventsResult.value.data || []).filter(e => e.event_date && new Date(e.event_date) >= now).length;
            })();

            const summary = {
                upcomingAppointmentsCount: upcomingAppointmentsResult.status === 'fulfilled' && upcomingAppointmentsResult.value.success ? upcomingAppointmentsResult.value.data.length : 0,
                upcomingEventsCount,
                myRecentPostsCount: myPostsResult.status === 'fulfilled' && myPostsResult.value.success ? myPostsResult.value.data.length : 0,
                totalEventsCount: allEventsResult.status === 'fulfilled' && allEventsResult.value.success ? allEventsResult.value.pagination.total : 0, // Get total events
                activeForumsCount: 0, // Placeholder for now
                newNotificationsCount: 0, // Placeholder for now
                generatedAt: new Date().toISOString()
            };

            response(res, 200, 'Student dashboard summary retrieved successfully', summary);
        } catch (error) {
            logger.error('Error fetching student dashboard summary:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get a list of upcoming events for the student.
     */
    static async getUpcomingEvents(req, res) {
        try {
            const studentId = req.user.id;
            const limit = parseInt(req.query.limit) || 5;
            const result = await Event.getUserRsvpEvents(studentId, 1, limit);

            if (!result.success) {
                logger.error('Failed to fetch upcoming student events:', result.error);
                return errorResponse(res, 500, 'Failed to fetch upcoming events', result.error);
            }

            const now = new Date();
            const upcoming = (result.data || [])
                .filter(e => e.event_date && new Date(e.event_date) >= now)
                .sort((a, b) => new Date(a.event_date) - new Date(b.event_date))
                .slice(0, limit);

            response(res, 200, 'Upcoming student events retrieved successfully', upcoming);
        } catch (error) {
            logger.error('Error fetching upcoming student events:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get a list of upcoming appointments for the student.
     */
    static async getUpcomingAppointments(req, res) {
        try {
            const studentId = req.user.id;
            const limit = parseInt(req.query.limit) || 5;
            const result = await Appointment.findUpcomingAppointments(studentId, 'requester', { limit });

            if (!result.success) {
                logger.error('Failed to fetch upcoming student appointments:', result.error);
                return errorResponse(res, 500, 'Failed to fetch upcoming appointments', result.error);
            }

            response(res, 200, 'Upcoming student appointments retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error fetching upcoming student appointments:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get a list of recent posts by the student.
     */
    static async getRecentPosts(req, res) {
        try {
            const studentId = req.user.id;
            const limit = parseInt(req.query.limit) || 5;
            const result = await Post.findByUser(studentId, 1, limit);

            if (!result.success) {
                logger.error('Failed to fetch recent student posts:', result.error);
                return errorResponse(res, 500, 'Failed to fetch recent posts', result.error);
            }

            response(res, 200, 'Recent student posts retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error fetching recent student posts:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = StudentDashboardController;
