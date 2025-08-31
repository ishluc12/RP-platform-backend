const Event = require('../../models/Event');
const { logger } = require('../../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../../utils/responseHandlers');

class LecturerEventController {
    // Create event (lecturer can create events)
    static async createEvent(req, res) {
        try {
            const { title, description, event_date, location } = req.body;
            const created_by = req.user.id;

            // Validation
            if (!title || !event_date) {
                return sendErrorResponse(res, 400, 'Title and event date are required');
            }

            // Validate event date is in the future
            const eventDate = new Date(event_date);
            if (eventDate <= new Date()) {
                return sendErrorResponse(res, 400, 'Event date must be in the future');
            }

            const eventData = {
                title: title.trim(),
                description: description?.trim() || null,
                event_date: eventDate.toISOString(),
                location: location?.trim() || null,
                created_by
            };

            const result = await Event.create(eventData);

            if (!result.success) {
                logger.error('Failed to create event:', result.error);
                return sendErrorResponse(res, 500, 'Failed to create event', result.error);
            }

            return sendSuccessResponse(res, 201, 'Event created successfully', result.data);
        } catch (error) {
            logger.error('Error in lecturer createEvent:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get lecturer's own events
    static async getMyEvents(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await Event.findByCreator(userId, page, limit);

            if (!result.success) {
                logger.error('Failed to fetch lecturer events:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch your events', result.error);
            }

            return sendSuccessResponse(res, 200, 'Your events retrieved successfully', {
                events: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in getMyEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get upcoming events (lecturer view)
    static async getUpcomingEvents(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 15;
            const result = await Event.findUpcoming(limit);

            if (!result.success) {
                logger.error('Failed to fetch upcoming events:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch upcoming events', result.error);
            }

            return sendSuccessResponse(res, 200, 'Upcoming events retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error in getUpcomingEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get past events (lecturer view)
    static async getPastEvents(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 15;
            const result = await Event.findPast(limit);

            if (!result.success) {
                logger.error('Failed to fetch past events:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch past events', result.error);
            }

            return sendSuccessResponse(res, 200, 'Past events retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error in getPastEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Update lecturer's own event
    static async updateEvent(req, res) {
        try {
            const { id } = req.params;
            const eventId = parseInt(id);
            const { title, description, event_date, location } = req.body;
            const userId = req.user.id;

            if (isNaN(eventId)) {
                return sendErrorResponse(res, 400, 'Invalid event ID');
            }

            // Check if event exists and lecturer owns it
            const existingEvent = await Event.findById(eventId);
            if (!existingEvent.success) {
                return sendErrorResponse(res, 404, 'Event not found');
            }

            // Only creator can update
            if (existingEvent.data.created_by !== userId) {
                return sendErrorResponse(res, 403, 'You can only update events you created');
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
            logger.error('Error in lecturer updateEvent:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Delete lecturer's own event
    static async deleteEvent(req, res) {
        try {
            const { id } = req.params;
            const eventId = parseInt(id);
            const userId = req.user.id;

            if (isNaN(eventId)) {
                return sendErrorResponse(res, 400, 'Invalid event ID');
            }

            // Check if event exists and lecturer owns it
            const existingEvent = await Event.findById(eventId);
            if (!existingEvent.success) {
                return sendErrorResponse(res, 404, 'Event not found');
            }

            // Only creator can delete
            if (existingEvent.data.created_by !== userId) {
                return sendErrorResponse(res, 403, 'You can only delete events you created');
            }

            const result = await Event.delete(eventId);

            if (!result.success) {
                logger.error('Failed to delete event:', result.error);
                return sendErrorResponse(res, 500, 'Failed to delete event', result.error);
            }

            return sendSuccessResponse(res, 200, 'Event deleted successfully', result.data);
        } catch (error) {
            logger.error('Error in lecturer deleteEvent:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get event by ID (lecturer can view any event)
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
            logger.error('Error in lecturer getEventById:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Search events (lecturer can search all events)
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
            logger.error('Error in lecturer searchEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get lecturer's event statistics
    static async getMyEventStats(req, res) {
        try {
            const userId = req.user.id;
            const db = require('../../config/database');

            // Get total events by this lecturer
            const totalEventsQuery = 'SELECT COUNT(*) as total FROM events WHERE created_by = $1';
            const totalEventsResult = await db.query(totalEventsQuery, [userId]);
            const totalEvents = parseInt(totalEventsResult.rows[0].total);

            // Get upcoming events by this lecturer
            const upcomingEventsQuery = 'SELECT COUNT(*) as upcoming FROM events WHERE created_by = $1 AND event_date >= NOW()';
            const upcomingEventsResult = await db.query(upcomingEventsQuery, [userId]);
            const upcomingEvents = parseInt(upcomingEventsResult.rows[0].upcoming);

            // Get past events by this lecturer
            const pastEventsQuery = 'SELECT COUNT(*) as past FROM events WHERE created_by = $1 AND event_date < NOW()';
            const pastEventsResult = await db.query(pastEventsQuery, [userId]);
            const pastEvents = parseInt(pastEventsResult.rows[0].past);

            const stats = {
                totalEvents,
                upcomingEvents,
                pastEvents
            };

            return sendSuccessResponse(res, 200, 'Event statistics retrieved successfully', stats);
        } catch (error) {
            logger.error('Error in getMyEventStats:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get event participants for lecturer's events
    static async getEventParticipants(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const eventId = parseInt(id);
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            if (isNaN(eventId)) {
                return sendErrorResponse(res, 400, 'Invalid event ID');
            }

            // Check if lecturer owns this event
            const db = require('../../config/database');
            const eventOwnershipQuery = 'SELECT created_by FROM events WHERE id = $1';
            const ownershipResult = await db.query(eventOwnershipQuery, [eventId]);

            if (ownershipResult.rows.length === 0) {
                return sendErrorResponse(res, 404, 'Event not found');
            }

            if (ownershipResult.rows[0].created_by !== userId && req.user.role !== 'admin' && req.user.role !== 'sys_admin') {
                return sendErrorResponse(res, 403, 'You can only view participants for your own events');
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
            logger.error('Error in lecturer getEventParticipants:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get event statistics for lecturer's events
    static async getEventStats(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const eventId = parseInt(id);

            if (isNaN(eventId)) {
                return sendErrorResponse(res, 400, 'Invalid event ID');
            }

            // Check if lecturer owns this event
            const db = require('../../config/database');
            const eventOwnershipQuery = 'SELECT created_by FROM events WHERE id = $1';
            const ownershipResult = await db.query(eventOwnershipQuery, [eventId]);

            if (ownershipResult.rows.length === 0) {
                return sendErrorResponse(res, 404, 'Event not found');
            }

            if (ownershipResult.rows[0].created_by !== userId && req.user.role !== 'admin' && req.user.role !== 'admin' && req.user.role !== 'sys_admin') {
                return sendErrorResponse(res, 403, 'You can only view statistics for your own events');
            }

            const result = await Event.getEventStats(eventId);

            if (!result.success) {
                return sendErrorResponse(res, 404, 'Event not found');
            }

            return sendSuccessResponse(res, 200, 'Event statistics retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error in lecturer getEventStats:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = LecturerEventController;
