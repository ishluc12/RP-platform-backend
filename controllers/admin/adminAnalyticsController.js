const User = require('../../models/User');
const Event = require('../../models/Event');
const Post = require('../../models/Post');
const Message = require('../../models/Message');
const Forum = require('../../models/Forum');
const Poll = require('../../models/Poll');
const Appointment = require('../../models/Appointment');
const Comment = require('../../models/Comment'); // Added Comment model
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class AdminAnalyticsController {
    /**
     * Get overall platform statistics (total users, events, posts, etc.)
     */
    static async getOverallPlatformStats(req, res) {
        try {
            // Get all users to calculate role distribution
            const { data: allUsers, error: usersError } = await User.findAll(1, 99999, {});
            if (usersError) throw usersError;

            // Calculate role distribution
            const roleStats = allUsers.reduce((acc, user) => {
                const role = user.role || 'student';
                acc[role] = (acc[role] || 0) + 1;
                return acc;
            }, {});

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
                studentCount: roleStats.student || 0,
                lecturerCount: roleStats.lecturer || 0,
                staffCount: (roleStats.administrator || 0) + (roleStats.sys_admin || 0),
                adminCount: roleStats.sys_admin || 0,
                activeSessions: Math.floor(Math.random() * 50) + 10, // Mock data for now
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
        let startDate = new Date();
        let days = 30;

        switch (period) {
            case '7d':
                days = 7;
                startDate.setDate(startDate.getDate() - 7);
                break;
            case '30d':
                days = 30;
                startDate.setDate(startDate.getDate() - 30);
                break;
            case '90d':
                days = 90;
                startDate.setDate(startDate.getDate() - 90);
                break;
            default:
                days = 30;
                startDate.setDate(startDate.getDate() - 30);
                break;
        }

        try {
            const { data: users, error } = await User.findAll(1, 99999);
            if (error) throw error;

            // Initialize userGrowth with all dates in range
            const userGrowth = {};
            for (let i = days - 1; i >= 0; i--) {
                const date = new Date();
                date.setDate(date.getDate() - i);
                const key = date.toISOString().substring(0, 10);
                userGrowth[key] = 0;
            }

            // Count users by registration date
            users.forEach(user => {
                const userDate = new Date(user.created_at);
                if (userDate >= startDate) {
                    const key = userDate.toISOString().substring(0, 10);
                    if (userGrowth.hasOwnProperty(key)) {
                        userGrowth[key]++;
                    }
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
            const totalEventsResult = await Event.findAll(1, 1, {});
            const totalForumsResult = await Forum.getAll({});
            const totalPollsResult = await Poll.getAll({});

            // Get total comments count (simplified approach)
            let totalComments = 0;
            try {
                // Try to get all posts and count their comments
                const { data: allPosts } = await Post.findAll(1, 99999, {});
                for (const post of allPosts) {
                    try {
                        const comments = await Comment.getCommentsByPost(post.id);
                        if (comments && comments.data) {
                            totalComments += comments.data.length;
                        }
                    } catch (commentError) {
                        // Skip if comment fetching fails for this post
                        continue;
                    }
                }
            } catch (commentError) {
                logger.warn('Could not fetch comments count:', commentError.message);
                totalComments = 0;
            }

            const overview = {
                totalPosts: totalPostsResult.pagination ? totalPostsResult.pagination.total : 0,
                totalEvents: totalEventsResult.pagination ? totalEventsResult.pagination.total : 0,
                totalComments,
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
            // Get all appointments to calculate metrics
            const { data: allAppointments, error: allError } = await Appointment.findAll(1, 99999, {});
            if (allError) throw allError;

            const totalAppointments = allAppointments.length;
            const completedAppointments = allAppointments.filter(apt => apt.status === 'completed').length;
            const pendingAppointments = allAppointments.filter(apt => apt.status === 'pending').length;
            const approvedAppointments = allAppointments.filter(apt => apt.status === 'approved').length;
            const rejectedAppointments = allAppointments.filter(apt => apt.status === 'rejected').length;

            const metrics = {
                totalAppointments,
                completedAppointments,
                pendingAppointments,
                approvedAppointments,
                rejectedAppointments,
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
