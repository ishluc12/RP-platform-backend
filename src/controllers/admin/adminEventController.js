const Event = require('../../models/Event');
const { logger } = require('../../utils/logger');
const { response, errorResponse } = require('../../utils/responseHandlers');

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
            if (req.query.created_by) filters.created_by = req.query.created_by;
            if (req.query.event_date_from) filters.event_date_from = req.query.event_date_from;
            if (req.query.event_date_to) filters.event_date_to = req.query.event_date_to;
            if (req.query.status) filters.status = req.query.status;

            const result = await Event.findAll(page, limit, filters);

            if (!result.success) {
                logger.error('Failed to fetch events:', result.error);
                return errorResponse(res, 500, 'Failed to fetch events', result.error);
            }

            return response(res, 200, 'Events retrieved successfully', result.data, result.pagination);
        } catch (error) {
            logger.error('Error in admin getAllEvents:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get event statistics for admin dashboard
    static async getEventStats(req, res) {
        try {
            const { id } = req.params; // Optional event ID for specific stats

            const result = await Event.getEventStats(id || null);

            if (!result.success) {
                logger.error('Failed to fetch event statistics:', result.error);
                return errorResponse(res, 500, 'Failed to fetch event statistics', result.error);
            }

            return response(res, 200, 'Event statistics retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error in admin getEventStats:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Admin can update any event
    static async updateEvent(req, res) {
        try {
            const { id } = req.params;
            const eventId = id;
            const updates = req.body; // Pass all updates directly

            if (!eventId) {
                return errorResponse(res, 400, 'Invalid event ID');
            }

            // Admin is allowed to update any event, authorization will be handled by RLS if configured
            const result = await Event.update(eventId, updates);

            if (!result.success) {
                logger.error('Failed to update event:', result.error);
                return errorResponse(res, 500, 'Failed to update event', result.error);
            }

            return response(res, 200, 'Event updated successfully', result.data);
        } catch (error) {
            logger.error('Error in admin updateEvent:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Admin can delete any event
    static async deleteEvent(req, res) {
        try {
            const { id } = req.params;
            const eventId = id;

            if (!eventId) {
                return errorResponse(res, 400, 'Invalid event ID');
            }

            // Admin is allowed to delete any event, authorization will be handled by RLS if configured
            const result = await Event.delete(eventId);

            if (!result.success) {
                logger.error('Failed to delete event:', result.error);
                return errorResponse(res, 500, 'Failed to delete event', result.error);
            }

            return response(res, 200, 'Event deleted successfully', result.data);
        } catch (error) {
            logger.error('Error in admin deleteEvent:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get events by specific user (admin view)
    static async getEventsByUser(req, res) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;
            const creatorId = userId;

            if (!creatorId) {
                return errorResponse(res, 400, 'Invalid user ID');
            }

            const result = await Event.findByCreator(creatorId, page, limit);

            if (!result.success) {
                logger.error('Failed to fetch events by user:', result.error);
                return errorResponse(res, 500, 'Failed to fetch events by user', result.error);
            }

            return response(res, 200, 'User events retrieved successfully', {
                events: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in getEventsByUser:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Bulk delete events (admin only)
    static async bulkDeleteEvents(req, res) {
        try {
            const { eventIds } = req.body;

            if (!Array.isArray(eventIds) || eventIds.length === 0) {
                return errorResponse(res, 400, 'Event IDs array is required');
            }

            const results = [];
            let successCount = 0;
            let errorCount = 0;

            for (const eventId of eventIds) {
                try {
                    const result = await Event.delete(eventId);
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

            return response(res, 200, 'Bulk delete operation completed', {
                results,
                summary: {
                    total: eventIds.length,
                    success: successCount,
                    failed: errorCount
                }
            });
        } catch (error) {
            logger.error('Error in bulkDeleteEvents:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
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
            if (req.query.created_by) filters.created_by = req.query.created_by;
            if (req.query.event_date_from) filters.event_date_from = req.query.event_date_from;
            if (req.query.event_date_to) filters.event_date_to = req.query.event_date_to;
            if (req.query.department) filters.department = req.query.department;

            const result = await Event.findAll(page, limit, filters);

            if (!result.success) {
                logger.error('Failed to fetch events with advanced filters:', result.error);
                return errorResponse(res, 500, 'Failed to fetch events', result.error);
            }

            return response(res, 200, 'Events retrieved successfully', {
                events: result.data,
                pagination: result.pagination,
                filters: filters
            });
        } catch (error) {
            logger.error('Error in getEventsWithAdvancedFilters:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = AdminEventController;
