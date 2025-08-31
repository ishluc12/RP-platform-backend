// D:\final-year-project\backend\src\controllers\shared\eventController.js
const Event = require('../../models/Event');
const { logger } = require('../../utils/logger');
const { sendSuccessResponse, sendErrorResponse } = require('../../utils/responseHandlers');

class EventController {
    // Create a new event
    static async createEvent(req, res) {
        try {
            const { title, description, event_date, location } = req.body;
            const userId = req.user.id; // Get user ID from authenticated request
            const userRole = req.user.role; // Get user role from authenticated request

            // Policy: Only administrator and sys_admin roles can create events
            if (userRole !== 'administrator' && userRole !== 'sys_admin') {
                return sendErrorResponse(res, 403, 'Forbidden: Only administrators can create events');
            }

            const eventDate = new Date(event_date);
            if (eventDate <= new Date()) {
                return sendErrorResponse(res, 400, 'Event date must be in the future');
            }

            const eventData = {
                title: title.trim(),
                description: description?.trim() || null,
                event_date: eventDate.toISOString(),
                location: location?.trim() || null,
                // Ensure the key matches the database column
                created_by: userId
            };

            const result = await Event.create(eventData);

            if (!result.success) {
                logger.error('Failed to create event:', result.error);
                return sendErrorResponse(res, 500, 'Failed to create event', result.error.message || result.error);
            }

            return sendSuccessResponse(res, 201, 'Event created successfully', result.data);
        } catch (error) {
            logger.error('Error in createEvent:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get all events with pagination and filters
    static async getAllEvents(req, res) {
        try {
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;
            const filters = {};

            // Apply filters from query parameters
            if (req.query.title) filters.title = req.query.title;
            if (req.query.location) filters.location = req.query.location;
            if (req.query.created_by) filters.created_by = req.query.created_by;
            if (req.query.event_date_from) filters.event_date_from = req.query.event_date_from;
            if (req.query.event_date_to) filters.event_date_to = req.query.event_date_to;

            // Using the new model method name from the provided Event model
            const result = await Event.getEventsWithParticipantCounts(page, limit, filters);

            if (!result.success) {
                logger.error('Failed to fetch events:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch events', result.error);
            }

            return sendSuccessResponse(res, 200, 'Events retrieved successfully', {
                events: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in getAllEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get event by ID
    static async getEventById(req, res) {
        try {
            const { id } = req.params;
            const result = await Event.findById(id);

            if (!result.success) {
                return sendErrorResponse(res, 404, 'Event not found');
            }

            return sendSuccessResponse(res, 200, 'Event retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error in getEventById:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Update event
    static async updateEvent(req, res) {
        try {
            const { id } = req.params;
            const { title, description, event_date, location } = req.body;
            const userId = req.user.id;

            // Check if event exists and user has permission to update
            const existingEvent = await Event.findById(id);
            if (!existingEvent.success) {
                return sendErrorResponse(res, 404, 'Event not found');
            }

            // Only creator or admin can update
            if (existingEvent.data.created_by !== userId && req.user.role !== 'admin' && req.user.role !== 'sys_admin') {
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

            const result = await Event.update(id, updateData);

            if (!result.success) {
                logger.error('Failed to update event:', result.error);
                return sendErrorResponse(res, 500, 'Failed to update event', result.error);
            }

            return sendSuccessResponse(res, 200, 'Event updated successfully', result.data);
        } catch (error) {
            logger.error('Error in updateEvent:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Delete event
    static async deleteEvent(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            // Check if event exists and user has permission to delete
            const existingEvent = await Event.findById(id);
            if (!existingEvent.success) {
                return sendErrorResponse(res, 404, 'Event not found');
            }

            // Only creator or admin can delete
            if (existingEvent.data.created_by !== userId && req.user.role !== 'admin' && req.user.role !== 'sys_admin') {
                return sendErrorResponse(res, 403, 'You can only delete events you created');
            }

            const result = await Event.delete(id);

            if (!result.success) {
                logger.error('Failed to delete event:', result.error);
                return sendErrorResponse(res, 500, 'Failed to delete event', result.error);
            }

            return sendSuccessResponse(res, 200, 'Event deleted successfully', result.data);
        } catch (error) {
            logger.error('Error in deleteEvent:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get upcoming events
    static async getUpcomingEvents(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
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

    // Get past events
    static async getPastEvents(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 10;
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

    // Get events by creator
    static async getEventsByCreator(req, res) {
        try {
            const { userId } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await Event.findByCreator(userId, page, limit);

            if (!result.success) {
                logger.error('Failed to fetch events by creator:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch events by creator', result.error);
            }

            return sendSuccessResponse(res, 200, 'Events by creator retrieved successfully', {
                events: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in getEventsByCreator:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Search events
    static async searchEvents(req, res) {
        try {
            const { q } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

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
            logger.error('Error in searchEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get user's own events
    static async getMyEvents(req, res) {
        try {
            const userId = req.user.id;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            const result = await Event.findByCreator(userId, page, limit);

            if (!result.success) {
                logger.error('Failed to fetch user events:', result.error);
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

    // RSVP to an event
    static async rsvpToEvent(req, res) {
        try {
            const { id } = req.params;
            const { status } = req.body;
            const userId = req.user.id;

            if (!status || !['interested', 'going', 'not going'].includes(status)) {
                return sendErrorResponse(res, 400, 'Valid RSVP status is required (interested, going, or not going)');
            }

            const result = await Event.rsvpToEvent(id, userId, status);

            if (!result.success) {
                logger.error('Failed to RSVP to event:', result.error);
                return sendErrorResponse(res, 500, 'Failed to RSVP to event', result.error);
            }

            const actionText = result.action === 'created' ? 'RSVP submitted' : 'RSVP updated';
            return sendSuccessResponse(res, 200, `${actionText} successfully`, result.data);
        } catch (error) {
            logger.error('Error in rsvpToEvent:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Remove RSVP from an event
    static async removeRsvp(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const result = await Event.removeRsvp(id, userId);

            if (!result.success) {
                return sendErrorResponse(res, 404, 'RSVP not found');
            }

            return sendSuccessResponse(res, 200, 'RSVP removed successfully', result.data);
        } catch (error) {
            logger.error('Error in removeRsvp:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get event participants
    static async getEventParticipants(req, res) {
        try {
            const { id } = req.params;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 20;

            const result = await Event.getEventParticipants(id, page, limit);

            if (!result.success) {
                logger.error('Failed to fetch event participants:', result.error);
                return sendErrorResponse(res, 500, 'Failed to fetch event participants', result.error);
            }

            return sendSuccessResponse(res, 200, 'Event participants retrieved successfully', {
                participants: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in getEventParticipants:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get user's RSVP status for an event
    static async getUserRsvpStatus(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;

            const result = await Event.getUserRsvpStatus(id, userId);

            if (!result.success) {
                logger.error('Failed to get user RSVP status:', result.error);
                return sendErrorResponse(res, 500, 'Failed to get RSVP status', result.error);
            }

            return sendSuccessResponse(res, 200, 'RSVP status retrieved successfully', {
                status: result.status,
                data: result.data
            });
        } catch (error) {
            logger.error('Error in getUserRsvpStatus:', error);
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
            logger.error('Error in getUserRsvpEvents:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get event statistics
    static async getEventStats(req, res) {
        try {
            const { id } = req.params;

            const result = await Event.getEventStats(id);

            if (!result.success) {
                return sendErrorResponse(res, 404, 'Event not found');
            }

            return sendSuccessResponse(res, 200, 'Event statistics retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error in getEventStats:', error);
            return sendErrorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = EventController;