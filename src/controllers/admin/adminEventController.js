const Event = require('../../models/Event');
const { logger } = require('../../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../../utils/responseHandlers');

class AdminEventController {
    // Get all events with admin privileges (no restrictions)
    static async getAllEvents(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50; // Higher limit for admin
            const filters = {};

            // Apply filters from query parameters
            if (req.query.title) filters.title = req.query.title;
            if (req.query.location) filters.location = req.query.location;
            if (req.query.created_by) filters.created_by = parseInt(req.query.created_by);
            if (req.query.event_date_from) filters.event_date_from = req.query.event_date_from;
            if (req.query.event_date_to) filters.event_date_to = req.query.event_date_to;
            if (req.query.status) filters.status = req.query.status;

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
            logger.error('Error in admin getAllEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get event statistics for admin dashboard
    static async getEventStats(req, res) {
        try {
            const db = require('../../config/database');
            
            // Get total events count
            const totalEventsQuery = 'SELECT COUNT(*) as total FROM events';
            const totalEventsResult = await db.query(totalEventsQuery);
            const totalEvents = parseInt(totalEventsResult.rows[0].total);

            // Get upcoming events count
            const upcomingEventsQuery = 'SELECT COUNT(*) as upcoming FROM events WHERE event_date >= NOW()';
            const upcomingEventsResult = await db.query(upcomingEventsQuery);
            const upcomingEvents = parseInt(upcomingEventsResult.rows[0].upcoming);

            // Get past events count
            const pastEventsQuery = 'SELECT COUNT(*) as past FROM events WHERE event_date < NOW()';
            const pastEventsResult = await db.query(pastEventsQuery);
            const pastEvents = parseInt(pastEventsResult.rows[0].past);

            // Get events by month (last 6 months)
            const monthlyEventsQuery = `
                SELECT 
                    DATE_TRUNC('month', event_date) as month,
                    COUNT(*) as count
                FROM events 
                WHERE event_date >= NOW() - INTERVAL '6 months'
                GROUP BY DATE_TRUNC('month', event_date)
                ORDER BY month DESC
            `;
            const monthlyEventsResult = await db.query(monthlyEventsQuery);

            // Get top event creators
            const topCreatorsQuery = `
                SELECT 
                    u.name as creator_name,
                    u.email as creator_email,
                    COUNT(e.id) as event_count
                FROM events e
                JOIN users u ON e.created_by = u.id
                GROUP BY u.id, u.name, u.email
                ORDER BY event_count DESC
                LIMIT 10
            `;
            const topCreatorsResult = await db.query(topCreatorsQuery);

            const stats = {
                totalEvents,
                upcomingEvents,
                pastEvents,
                monthlyEvents: monthlyEventsResult.rows,
                topCreators: topCreatorsResult.rows
            };

            return sendSuccessResponse(res, 200, 'Event statistics retrieved successfully', stats);
        } catch (error) {
            logger.error('Error in getEventStats:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Admin can update any event
    static async updateEvent(req, res) {
        try {
            const { id } = req.params;
            const eventId = parseInt(id);
            const { title, description, event_date, location } = req.body;

            if (isNaN(eventId)) {
                return sendErrorResponse(res, 400, 'Invalid event ID');
            }

            // Check if event exists
            const existingEvent = await Event.findById(eventId);
            if (!existingEvent.success) {
                return sendErrorResponse(res, 404, 'Event not found');
            }

            // Validate event date if provided
            if (event_date) {
                const eventDate = new Date(event_date);
                if (eventDate <= new Date()) {
                    return sendErrorResponse(res, 400, 'Event date must be in the future');
                }
            }

            const updateData = {};
            if (title !== undefined) updateData.title = title.trim();
            if (description !== undefined) updateData.description = description?.trim() || null;
            if (event_date !== undefined) updateData.event_date = new Date(event_date).toISOString();
            if (location !== undefined) updateData.location = location?.trim() || null;

            if (Object.keys(updateData).length === 0) {
                return sendErrorResponse(res, 400, 'No valid fields to update');
            }

            const result = await Event.update(eventId, updateData);

            if (!result.success) {
                logger.error('Failed to update event:', result.error);
                return sendErrorResponse(res, 500, 'Failed to update event', result.error);
            }

            return sendSuccessResponse(res, 200, 'Event updated successfully', result.data);
        } catch (error) {
            logger.error('Error in admin updateEvent:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Admin can delete any event
    static async deleteEvent(req, res) {
        try {
            const { id } = req.params;
            const eventId = parseInt(id);

            if (isNaN(eventId)) {
                return sendErrorResponse(res, 400, 'Invalid event ID');
            }

            // Check if event exists
            const existingEvent = await Event.findById(eventId);
            if (!existingEvent.success) {
                return sendErrorResponse(res, 404, 'Event not found');
            }

            const result = await Event.delete(eventId);

            if (!result.success) {
                logger.error('Failed to delete event:', result.error);
                return sendErrorResponse(res, 500, 'Failed to delete event', result.error);
            }

            return sendSuccessResponse(res, 200, 'Event deleted successfully', result.data);
        } catch (error) {
            logger.error('Error in admin deleteEvent:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get events by specific user (admin view)
    static async getEventsByUser(req, res) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const creatorId = parseInt(userId);

            if (isNaN(creatorId)) {
                return sendErrorResponse(res, 400, 'Invalid user ID');
            }

            const result = await Event.findByCreator(creatorId, page, limit);

            if (!result.success) {
                logger.error('Failed to fetch events by user:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch events by user', result.error);
            }

            return sendSuccessResponse(res, 200, 'User events retrieved successfully', {
                events: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in getEventsByUser:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Bulk delete events (admin only)
    static async bulkDeleteEvents(req, res) {
        try {
            const { eventIds } = req.body;

            if (!Array.isArray(eventIds) || eventIds.length === 0) {
                return sendErrorResponse(res, 400, 'Event IDs array is required');
            }

            const db = require('../../config/database');
            const results = [];
            let successCount = 0;
            let errorCount = 0;

            for (const eventId of eventIds) {
                try {
                    const result = await Event.delete(parseInt(eventId));
                    if (result.success) {
                        successCount++;
                        results.push({ id: eventId, status: 'deleted' });
                    } else {
                        errorCount++;
                        results.push({ id: eventId, status: 'failed', error: result.error });
                    }
                } catch (error) {
                    errorCount++;
                    results.push({ id: eventId, status: 'failed', error: error.message });
                }
            }

            return sendSuccessResponse(res, 200, 'Bulk delete operation completed', {
                results,
                summary: {
                    total: eventIds.length,
                    success: successCount,
                    failed: errorCount
                }
            });
        } catch (error) {
            logger.error('Error in bulkDeleteEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get events with advanced filtering for admin
    static async getEventsWithAdvancedFilters(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 50;
            const filters = {};

            // Apply all possible filters
            if (req.query.title) filters.title = req.query.title;
            if (req.query.location) filters.location = req.query.location;
            if (req.query.created_by) filters.created_by = parseInt(req.query.created_by);
            if (req.query.event_date_from) filters.event_date_from = req.query.event_date_from;
            if (req.query.event_date_to) filters.event_date_to = req.query.event_date_to;
            if (req.query.department) filters.department = req.query.department;

            const result = await Event.findAll(page, limit, filters);

            if (!result.success) {
                logger.error('Failed to fetch events with advanced filters:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch events', result.error);
            }

            return sendSuccessResponse(res, 200, 'Events retrieved successfully', {
                events: result.data,
                pagination: result.pagination,
                filters: filters
            });
        } catch (error) {
            logger.error('Error in getEventsWithAdvancedFilters:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = AdminEventController;
