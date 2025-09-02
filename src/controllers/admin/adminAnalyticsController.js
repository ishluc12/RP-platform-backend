const User = require('../../models/User');
const Event = require('../../models/Event');
const Post = require('../../models/Post');
const Message = require('../../models/Message');
const Forum = require('../../models/Forum');
const Poll = require('../../models/Poll');
const Appointment = require('../../models/Appointment');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class AdminAnalyticsController {
    /**
     * Get overall platform statistics (total users, events, posts, etc.)
     */
    static async getOverallPlatformStats(req, res) {
        try {
            const totalUsersResult = await User.findAll(1, 1, {}); // Get total count
            const totalEventsResult = await Event.findAll(1, 1, {});
            const totalPostsResult = await Post.findAll(1, 1, {});
            const totalForumsResult = await Forum.getAll({});
            const totalPollsResult = await Poll.getAll({});

            const stats = {
                totalUsers: totalUsersResult.pagination ? totalUsersResult.pagination.total : 0,
                totalEvents: totalEventsResult.pagination ? totalEventsResult.pagination.total : 0,
                totalPosts: totalPostsResult.pagination ? totalPostsResult.pagination.total : 0,
                totalForums: totalForumsResult.pagination ? totalForumsResult.pagination.total : 0,
                totalPolls: totalPollsResult.pagination ? totalPollsResult.pagination.total : 0,
                generatedAt: new Date().toISOString()
            };

            response(res, 200, 'Overall platform statistics retrieved successfully', stats);
        } catch (error) {
            logger.error('Error fetching overall platform stats:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get user growth analytics over a period.
     */
    static async getUserGrowthAnalytics(req, res) {
        const { period = '30d' } = req.query;
        let interval = '1 day';
        let startDate = new Date();

        switch (period) {
            case '7d':
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90d':
                startDate.setDate(startDate.getDate() - 90);
                interval = '1 week';
                break;
            case '1y':
                startDate.setFullYear(startDate.getFullYear() - 1);
                interval = '1 month';
                break;
            default:
                startDate.setDate(startDate.getDate() - 30);
                break;
        }

        try {
            // This would ideally use a database function for aggregation.
            // For now, fetch all users and aggregate in application logic.
            const { data: users, error } = await User.findAll(1, 99999);
            if (error) throw error;

            const userGrowth = {};
            users.forEach(user => {
                const userDate = new Date(user.created_at);
                if (userDate >= startDate) {
                    let key;
                    if (interval === '1 day') {
                        key = userDate.toISOString().substring(0, 10); // YYYY-MM-DD
                    } else if (interval === '1 week') {
                        const year = userDate.getFullYear();
                        const week = Math.ceil((userDate - new Date(year, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
                        key = `${year}-W${String(week).padStart(2, '0')}`;
                    } else if (interval === '1 month') {
                        key = userDate.toISOString().substring(0, 7); // YYYY-MM
                    }
                    userGrowth[key] = (userGrowth[key] || 0) + 1;
                }
            });

            response(res, 200, 'User growth analytics retrieved successfully', { period, userGrowth });
        } catch (error) {
            logger.error('Error fetching user growth analytics:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get content overview (post counts, forum counts, poll counts).
     */
    static async getContentOverview(req, res) {
        try {
            const totalPostsResult = await Post.findAll(1, 1, {});
            const totalCommentsResult = await Message.findAll(1, 1, {}); // Assuming Message model is used for comments/messages
            const totalForumsResult = await Forum.getAll({});
            const totalPollsResult = await Poll.getAll({});

            const overview = {
                totalPosts: totalPostsResult.pagination ? totalPostsResult.pagination.total : 0,
                totalComments: totalCommentsResult.pagination ? totalCommentsResult.pagination.total : 0,
                totalForums: totalForumsResult.pagination ? totalForumsResult.pagination.total : 0,
                totalPolls: totalPollsResult.pagination ? totalPollsResult.pagination.total : 0,
                generatedAt: new Date().toISOString()
            };

            response(res, 200, 'Content overview retrieved successfully', overview);
        } catch (error) {
            logger.error('Error fetching content overview:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get appointment metrics.
     */
    static async getAppointmentMetrics(req, res) {
        try {
            // Total appointments
            const { data: totalAppts, error: totalErr } = await Appointment.findAll(1, 1, {}); // Assuming findAll also returns count
            if (totalErr) throw totalErr;
            const totalAppointments = totalAppts.pagination ? totalAppts.pagination.total : 0;

            // Completed appointments
            const { data: completedAppts, error: completedErr } = await Appointment.findAll(1, 1, { status: 'completed' });
            if (completedErr) throw completedErr;
            const completedAppointments = completedAppts.pagination ? completedAppts.pagination.total : 0;

            // Pending appointments
            const { data: pendingAppts, error: pendingErr } = await Appointment.findAll(1, 1, { status: 'pending' });
            if (pendingErr) throw pendingErr;
            const pendingAppointments = pendingAppts.pagination ? pendingAppts.pagination.total : 0;

            const metrics = {
                totalAppointments,
                completedAppointments,
                pendingAppointments,
                generatedAt: new Date().toISOString()
            };

            response(res, 200, 'Appointment metrics retrieved successfully', metrics);
        } catch (error) {
            logger.error('Error fetching appointment metrics:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = AdminAnalyticsController;
