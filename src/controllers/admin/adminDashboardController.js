const User = require('../../models/User');
const Event = require('../../models/Event');
const Post = require('../../models/Post');
const Forum = require('../../models/Forum');
const Appointment = require('../../models/Appointment');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class AdminDashboardController {
    /**
     * Get a summary of key metrics for the admin dashboard.
     */
    static async getDashboardSummary(req, res) {
        try {
            const [totalUsersResult, newUsersLast30DaysResult, totalEventsResult, upcomingEventsResult, totalAppointmentsResult, pendingAppointmentsResult, totalForumsResult, totalPostsResult, totalStudentsResult, totalLecturersResult] = await Promise.all([
                User.findAll(1, 1, {}),
                User.findAll(1, 1, { created_after: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString() }),
                Event.findAll(1, 1, {}),
                Event.findAll(1, 1, { event_date_from: new Date().toISOString() }),
                Appointment.findAll(1, 1, {}),
                Appointment.findAll(1, 1, { status: 'pending' }),
                Forum.getAll({ page: 1, limit: 99999 }),
                Post.findAll(1, 1, {}),
                User.findAll(1, 1, { role: 'student' }),
                User.findAll(1, 1, { role: 'lecturer' })
            ]);

            // Helper to safely get total from results
            const getTotal = (result) => {
                if (!result.success) {
                    logger.error('Error in dashboard query:', result.error);
                    return 0; // Return 0 or throw error based on desired behavior
                }
                // For models with pagination
                if (result.pagination && typeof result.pagination.total === 'number') {
                    return result.pagination.total;
                }
                // For models like Forum.getAll that return data array directly
                if (Array.isArray(result.data)) {
                    return result.data.length;
                }
                return 0;
            };

            const summary = {
                totalUsers: getTotal(totalUsersResult),
                totalStudents: getTotal(totalStudentsResult),
                totalLecturers: getTotal(totalLecturersResult),
                newUsersLast30Days: getTotal(newUsersLast30DaysResult),
                totalEvents: getTotal(totalEventsResult),
                upcomingEvents: getTotal(upcomingEventsResult),
                totalAppointments: getTotal(totalAppointmentsResult),
                pendingAppointments: getTotal(pendingAppointmentsResult),
                totalForums: getTotal(totalForumsResult),
                totalPosts: getTotal(totalPostsResult),
                generatedAt: new Date().toISOString()
            };

            response(res, 200, 'Dashboard summary retrieved successfully', summary);
        } catch (error) {
            logger.error('Error fetching dashboard summary:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get a list of recent activities across the platform.
     */
    static async getRecentActivity(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;

            // Fetch recent users
            const { data: recentUsers } = await User.findAll(1, limit, {});

            // Fetch recent events
            const { data: recentEvents } = await Event.findAll(1, limit, {});

            // Fetch recent posts
            const { data: recentPosts } = await Post.findAll(1, limit, {});

            // Combine and sort activities by creation date
            let allActivities = [
                ...(recentUsers || []).map(u => ({ type: 'user_registered', date: u.created_at, details: { id: u.id, name: u.name, email: u.email } })),
                ...(recentEvents || []).map(e => ({ type: 'event_created', date: e.created_at, details: { id: e.id, title: e.title, creator: e.users?.name } })),
                ...(recentPosts || []).map(p => ({ type: 'post_created', date: p.created_at, details: { id: p.id, content_snippet: p.content.substring(0, 50), creator: p.users?.name } }))
            ];

            allActivities.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

            // Transform activity for frontend display
            const transformedActivities = allActivities.slice(0, limit).map(activity => {
                let description = '';
                let userContext = '';

                switch (activity.type) {
                    case 'user_registered':
                        description = `New user registered: ${activity.details.name || activity.details.email}`;
                        userContext = activity.details.email;
                        break;
                    case 'event_created':
                        description = `New event created: ${activity.details.title}`;
                        userContext = activity.details.creator || 'Admin'; // Assuming e.users?.name is the creator
                        break;
                    case 'post_created':
                        description = `New post created: ${activity.details.content_snippet}...`;
                        userContext = activity.details.creator || 'Admin'; // Assuming p.users?.name is the creator
                        break;
                    default:
                        description = 'Unknown activity';
                        userContext = 'System';
                }

                return {
                    id: activity.details.id,
                    description: description,
                    user: { name: userContext }, // Standardize user info for frontend
                    timestamp: activity.date,
                    context: userContext // Provide context for fallback display
                };
            });

            response(res, 200, 'Recent activity retrieved successfully', transformedActivities);
        } catch (error) {
            logger.error('Error fetching recent activity:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Identify users who have created the most content (posts, events).
     */
    static async getTopCreators(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 5;

            // This would ideally use database aggregation (views or RPCs) for efficiency
            // For now, fetch all relevant data and aggregate in application logic.

            const [allPostsResult, allEventsResult] = await Promise.all([
                Post.findAll(1, 99999, {}),
                Event.findAll(1, 99999, {})
            ]);

            const creatorCounts = {};

            if (allPostsResult.success) {
                allPostsResult.data.forEach(post => {
                    if (post.user_id) {
                        creatorCounts[post.user_id] = (creatorCounts[post.user_id] || { postCount: 0, eventCount: 0 }) || { postCount: 0, eventCount: 0 };
                        creatorCounts[post.user_id].postCount++;
                    }
                });
            }

            if (allEventsResult.success) {
                allEventsResult.data.forEach(event => {
                    if (event.created_by) {
                        creatorCounts[event.created_by] = (creatorCounts[event.created_by] || { postCount: 0, eventCount: 0 }) || { postCount: 0, eventCount: 0 };
                        creatorCounts[event.created_by].eventCount++;
                    }
                });
            }

            const topCreatorsIds = Object.keys(creatorCounts).sort((a, b) => {
                const totalA = creatorCounts[a].postCount + creatorCounts[a].eventCount;
                const totalB = creatorCounts[b].postCount + creatorCounts[b].eventCount;
                return totalB - totalA;
            }).slice(0, limit);

            const topCreatorsDetails = await Promise.all(topCreatorsIds.map(async userId => {
                const userResult = await User.findById(userId);
                return userResult.success ? {
                    id: userResult.data.id,
                    name: userResult.data.name,
                    email: userResult.data.email,
                    counts: creatorCounts[userId]
                } : null;
            }));

            response(res, 200, 'Top creators retrieved successfully', topCreatorsDetails.filter(Boolean));
        } catch (error) {
            logger.error('Error fetching top creators:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get recent appointments for administrator (where they are the appointee)
     */
    static async getRecentAppointments(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const userId = req.user.id;
            
            // Fetch appointments where the administrator is the appointee
            const result = await Appointment.listByAppointee(userId);

            if (!result.success) {
                logger.error('Error fetching admin appointments:', result.error);
                return errorResponse(res, 500, 'Failed to fetch appointments', result.error);
            }

            // Sort by appointment time and limit results
            const sortedAppointments = (result.data || [])
                .sort((a, b) => new Date(b.appointment_time) - new Date(a.appointment_time))
                .slice(0, limit);

            response(res, 200, 'Recent appointments retrieved successfully', sortedAppointments);
        } catch (error) {
            logger.error('Error fetching recent appointments:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    /**
     * Get a list of recently registered users.
     */
    static async getRecentRegistrations(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
            const result = await User.findAll(1, limit, { sortBy: 'created_at', sortOrder: 'desc' });

            if (!result.success) {
                logger.error('Error fetching recent registrations:', result.error);
                return errorResponse(res, 500, 'Failed to fetch recent registrations', result.error);
            }

            // Filter sensitive info
            const sanitizedUsers = result.data.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                created_at: user.created_at
            }));

            response(res, 200, 'Recent registrations retrieved successfully', sanitizedUsers);
        } catch (error) {
            logger.error('Error fetching recent registrations:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = AdminDashboardController;
