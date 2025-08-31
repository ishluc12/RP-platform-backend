const Event = require('../../models/Event');
const { logger } = require('../../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../../utils/responseHandlers');

class StudentEventController {
    // Get all events (students can view all events)
    static async getAllEvents(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const filters = {};

            // Apply filters from query parameters
            if (req.query.title) filters.title = req.query.title;
            if (req.query.location) filters.location = req.query.location;
            if (req.query.created_by) filters.created_by = parseInt(req.query.created_by);
            if (req.query.event_date_from) filters.event_date_from = req.query.event_date_from;
            if (req.query.event_date_to) filters.event_date_to = req.query.event_date_to;

            const result = await Event.findAll(page, limit, filters);

            if (!result.success) {
                logger.error('Failed to fetch events:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch events', result.error);
            }

            return sendSuccessResponse(res, 200, 'Events retrieved successfully', {
                events: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in student getAllEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get event by ID (students can view any event)
    static async getEventById(req, res) {
        try {
            const { id } = req.params;
            const eventId = parseInt(id);

            if (isNaN(eventId)) {
                return sendErrorResponse(res, 400, 'Invalid event ID');
            }

            const result = await Event.findById(eventId);

            if (!result.success) {
                return sendErrorResponse(res, 404, 'Event not found');
            }

            return sendSuccessResponse(res, 200, 'Event retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error in student getEventById:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get upcoming events (student view)
    static async getUpcomingEvents(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const result = await Event.findUpcoming(limit);

            if (!result.success) {
                logger.error('Failed to fetch upcoming events:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch upcoming events', result.error);
            }

            return sendSuccessResponse(res, 200, 'Upcoming events retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error in student getUpcomingEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get past events (student view)
    static async getPastEvents(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 20;
            const result = await Event.findPast(limit);

            if (!result.success) {
                logger.error('Failed to fetch past events:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch past events', result.error);
            }

            return sendSuccessResponse(res, 200, 'Past events retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error in student getPastEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Search events (students can search all events)
    static async searchEvents(req, res) {
        try {
            const { q } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;

            if (!q || q.trim().length === 0) {
                return sendErrorResponse(res, 400, 'Search query is required');
            }

            const result = await Event.searchEvents(q.trim(), page, limit);

            if (!result.success) {
                logger.error('Failed to search events:', result.error);
                return sendErrorResponse(res, 500, 'Failed to search events', result.error);
            }

            return sendSuccessResponse(res, 200, 'Events search completed successfully', {
                events: result.data,
                pagination: result.pagination,
                searchQuery: q.trim()
            });
        } catch (error) {
            logger.error('Error in student searchEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get events by creator (students can view events by any user)
    static async getEventsByCreator(req, res) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const creatorId = parseInt(userId);

            if (isNaN(creatorId)) {
                return sendErrorResponse(res, 400, 'Invalid user ID');
            }

            const result = await Event.findByCreator(creatorId, page, limit);

            if (!result.success) {
                logger.error('Failed to fetch events by creator:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch events by creator', result.error);
            }

            return sendSuccessResponse(res, 200, 'Events by creator retrieved successfully', {
                events: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in student getEventsByCreator:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get events by department (students can filter by department)
    static async getEventsByDepartment(req, res) {
        try {
            const { department } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;

            if (!department) {
                return sendErrorResponse(res, 400, 'Department parameter is required');
            }

            const db = require('../../config/database');

            // Count total events by department
            const countQuery = `
                SELECT COUNT(*) as total
                FROM events e
                JOIN users u ON e.created_by = u.id
                WHERE u.department ILIKE $1
            `;
            const countResult = await db.query(countQuery, [`%${department}%`]);
            const total = parseInt(countResult.rows[0].total);

            // Get paginated events by department
            const offset = (page - 1) * limit;
            const query = `
                SELECT e.*, u.name as creator_name, u.email as creator_email, u.department
                FROM events e
                JOIN users u ON e.created_by = u.id
                WHERE u.department ILIKE $1
                ORDER BY e.event_date ASC
                LIMIT $2 OFFSET $3
            `;

            const result = await db.query(query, [`%${department}%`, limit, offset]);

            return sendSuccessResponse(res, 200, 'Department events retrieved successfully', {
                events: result.rows,
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.ceil(total / limit)
                },
                department: department
            });
        } catch (error) {
            logger.error('Error in getEventsByDepartment:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get today's events
    static async getTodayEvents(req, res) {
        try {
            const db = require('../../config/database');

            const query = `
                SELECT e.*, u.name as creator_name, u.email as creator_email
                FROM events e
                LEFT JOIN users u ON e.created_by = u.id
                WHERE DATE(e.event_date) = CURRENT_DATE
                ORDER BY e.event_date ASC
            `;

            const result = await db.query(query);

            return sendSuccessResponse(res, 200, 'Today\'s events retrieved successfully', result.rows);
        } catch (error) {
            logger.error('Error in getTodayEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get this week's events
    static async getThisWeekEvents(req, res) {
        try {
            const db = require('../../config/database');

            const query = `
                SELECT e.*, u.name as creator_name, u.email as creator_email
                FROM events e
                LEFT JOIN users u ON e.created_by = u.id
                WHERE e.event_date >= CURRENT_DATE 
                AND e.event_date < CURRENT_DATE + INTERVAL '7 days'
                ORDER BY e.event_date ASC
            `;

            const result = await db.query(query);

            return sendSuccessResponse(res, 200, 'This week\'s events retrieved successfully', result.rows);
        } catch (error) {
            logger.error('Error in getThisWeekEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get this month's events
    static async getThisMonthEvents(req, res) {
        try {
            const db = require('../../config/database');

            const query = `
                SELECT e.*, u.name as creator_name, u.email as creator_email
                FROM events e
                LEFT JOIN users u ON e.created_by = u.id
                WHERE e.event_date >= DATE_TRUNC('month', CURRENT_DATE)
                AND e.event_date < DATE_TRUNC('month', CURRENT_DATE) + INTERVAL '1 month'
                ORDER BY e.event_date ASC
            `;

            const result = await db.query(query);

            return sendSuccessResponse(res, 200, 'This month\'s events retrieved successfully', result.rows);
        } catch (error) {
            logger.error('Error in getThisMonthEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // RSVP to an event (students can RSVP)
    static async rsvpToEvent(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const userId = req.user.id;
            const eventId = parseInt(id);

            if (isNaN(eventId)) {
                return sendErrorResponse(res, 400, 'Invalid event ID');
            }

            if (!status || !['interested', 'going', 'not going'].includes(status)) {
                return sendErrorResponse(res, 400, 'Valid RSVP status is required (interested, going, or not going)');
            }

            const result = await Event.rsvpToEvent(eventId, userId, status);

            if (!result.success) {
                logger.error('Failed to RSVP to event:', result.error);
                return sendErrorResponse(res, 500, 'Failed to RSVP to event', result.error);
            }

            const actionText = result.action === 'created' ? 'RSVP submitted' : 'RSVP updated';
            return sendSuccessResponse(res, 200, `${actionText} successfully`, result.data);
        } catch (error) {
            logger.error('Error in student rsvpToEvent:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get events with participant counts (student view)
    static async getEventsWithParticipantCounts(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;
            const filters = {};

            // Apply filters from query parameters
            if (req.query.title) filters.title = req.query.title;
            if (req.query.location) filters.location = req.query.location;
            if (req.query.created_by) filters.created_by = parseInt(req.query.created_by);

            const result = await Event.getEventsWithParticipantCounts(page, limit, filters);

            if (!result.success) {
                logger.error('Failed to fetch events with participant counts:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch events', result.error);
            }

            return sendSuccessResponse(res, 200, 'Events with participant counts retrieved successfully', {
                events: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in getEventsWithParticipantCounts:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Remove RSVP from an event
    static async removeRsvp(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const eventId = parseInt(id);

            if (isNaN(eventId)) {
                return sendErrorResponse(res, 400, 'Invalid event ID');
            }

            const result = await Event.removeRsvp(eventId, userId);

            if (!result.success) {
                return sendErrorResponse(res, 404, 'RSVP not found');
            }

            return sendSuccessResponse(res, 200, 'RSVP removed successfully', result.data);
        } catch (error) {
            logger.error('Error in student removeRsvp:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get event participants
    static async getEventParticipants(req, res) {
        try {
            const { id } = req.params;
            const eventId = parseInt(id);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            if (isNaN(eventId)) {
                return sendErrorResponse(res, 400, 'Invalid event ID');
            }

            const result = await Event.getEventParticipants(eventId, page, limit);

            if (!result.success) {
                logger.error('Failed to fetch event participants:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch event participants', result.error);
            }

            return sendSuccessResponse(res, 200, 'Event participants retrieved successfully', {
                participants: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in student getEventParticipants:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get user's RSVP status for an event
    static async getUserRsvpStatus(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const eventId = parseInt(id);

            if (isNaN(eventId)) {
                return sendErrorResponse(res, 400, 'Invalid event ID');
            }

            const result = await Event.getUserRsvpStatus(eventId, userId);

            if (!result.success) {
                logger.error('Failed to get user RSVP status:', result.error);
                return sendErrorResponse(res, 500, 'Failed to get RSVP status', result.error);
            }

            return sendSuccessResponse(res, 200, 'RSVP status retrieved successfully', {
                status: result.status,
                data: result.data
            });
        } catch (error) {
            logger.error('Error in student getUserRsvpStatus:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get events user has RSVP'd to
    static async getUserRsvpEvents(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await Event.getUserRsvpEvents(userId, page, limit);

            if (!result.success) {
                logger.error('Failed to fetch user RSVP events:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch your RSVP events', result.error);
            }

            return sendSuccessResponse(res, 200, 'Your RSVP events retrieved successfully', {
                events: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in student getUserRsvpEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get event statistics
    static async getEventStats(req, res) {
        try {
            const { id } = req.params;
            const eventId = parseInt(id);

            if (isNaN(eventId)) {
                return sendErrorResponse(res, 400, 'Invalid event ID');
            }

            const result = await Event.getEventStats(eventId);

            if (!result.success) {
                return sendErrorResponse(res, 404, 'Event not found');
            }

            return sendSuccessResponse(res, 200, 'Event statistics retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error in student getEventStats:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = StudentEventController;
