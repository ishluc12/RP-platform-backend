const Event = require('../../models/Event');
const { logger } = require('../../utils/logger');
const { response, errorResponse } = require('../../utils/responseHandlers');
// const { sendSuccessResponse, sendErrorResponse } = require('../../utils/responseHandlers');

class LecturerEventController {
    // Create event (lecturer can create events)
    static async createEvent(req, res) {
        try {
            const { title, description, event_date, location, max_participants, registration_required } = req.body;
            const created_by = req.user.id;

            // Validation
            if (!title || !event_date || !location) {
                return errorResponse(res, 400, 'Title, event date, and location are required');
            }

            // Validate event date is in the future
            const eventDate = new Date(event_date);
            if (eventDate <= new Date()) {
                return errorResponse(res, 400, 'Event date must be in the future');
            }

            const eventData = {
                title: title.trim(),
                description: description?.trim() || null,
                event_date: eventDate.toISOString(),
                location: location?.trim() || null,
                created_by,
                max_participants,
                registration_required
            };

            const result = await Event.create(eventData);

            if (!result.success) {
                logger.error('Failed to create event:', result.error);
                return errorResponse(res, 500, 'Failed to create event', result.error);
            }

            return response(res, 201, 'Event created successfully', result.data);
        } catch (error) {
            logger.error('Error in lecturer createEvent:', error.message);
            return errorResponse(res, 500, 'Internal server error', error.message);
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
                return errorResponse(res, 500, 'Failed to fetch your events', result.error);
            }

            return response(res, 200, 'Your events retrieved successfully', {
                events: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in getMyEvents:', error.message);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get upcoming events (lecturer view)
    static async getUpcomingEvents(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 15;
            const result = await Event.findUpcoming(limit);

            if (!result.success) {
                logger.error('Failed to fetch upcoming events:', result.error);
                return errorResponse(res, 500, 'Failed to fetch upcoming events', result.error);
            }

            return response(res, 200, 'Upcoming events retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error in getUpcomingEvents:', error.message);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get past events (lecturer view)
    static async getPastEvents(req, res) {
        try {
            const limit = parseInt(req.query.limit) || 15;
            const result = await Event.findPast(limit);

            if (!result.success) {
                logger.error('Failed to fetch past events:', result.error);
                return errorResponse(res, 500, 'Failed to fetch past events', result.error);
            }

            return response(res, 200, 'Past events retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error in getPastEvents:', error.message);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Update lecturer's own event
    static async updateEvent(req, res) {
        try {
            const { id } = req.params;
            const eventId = parseInt(id);
            const updates = req.body;
            const userId = req.user.id;

            if (isNaN(eventId)) {
                return errorResponse(res, 400, 'Invalid event ID');
            }

            // Check if event exists and lecturer owns it
            const existingEvent = await Event.findById(eventId);
            if (!existingEvent.success) {
                return errorResponse(res, 404, 'Event not found');
            }

            // Only creator can update
            if (existingEvent.data.created_by !== userId) {
                return errorResponse(res, 403, 'You can only update events you created');
            }

            const result = await Event.update(eventId, updates);

            if (!result.success) {
                logger.error('Failed to update event:', result.error);
                return errorResponse(res, 500, 'Failed to update event', result.error);
            }

            return response(res, 200, 'Event updated successfully', result.data);
        } catch (error) {
            logger.error('Error in lecturer updateEvent:', error.message);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Delete lecturer's own event
    static async deleteEvent(req, res) {
        try {
            const { id } = req.params;
            const eventId = parseInt(id);
            const userId = req.user.id;

            if (isNaN(eventId)) {
                return errorResponse(res, 400, 'Invalid event ID');
            }

            // Check if event exists and lecturer owns it
            const existingEvent = await Event.findById(eventId);
            if (!existingEvent.success) {
                return errorResponse(res, 404, 'Event not found');
            }

            // Only creator can delete
            if (existingEvent.data.created_by !== userId) {
                return errorResponse(res, 403, 'You can only delete events you created');
            }

            const result = await Event.delete(eventId);

            if (!result.success) {
                logger.error('Failed to delete event:', result.error);
                return errorResponse(res, 500, 'Failed to delete event', result.error);
            }

            return response(res, 200, 'Event deleted successfully', result.data);
        } catch (error) {
            logger.error('Error in lecturer deleteEvent:', error.message);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get event by ID (lecturer can view any event)
    static async getEventById(req, res) {
        try {
            const { id } = req.params;
            const eventId = parseInt(id);

            if (isNaN(eventId)) {
                return errorResponse(res, 400, 'Invalid event ID');
            }

            const result = await Event.findById(eventId);

            if (!result.success) {
                return errorResponse(res, 404, 'Event not found');
            }

            return response(res, 200, 'Event retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error in lecturer getEventById:', error.message);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Search events (lecturer can search all events)
    static async searchEvents(req, res) {
        try {
            const { q } = req.query;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 15;

            if (!q || q.trim().length === 0) {
                return errorResponse(res, 400, 'Search query is required');
            }

            const result = await Event.searchEvents(q.trim(), page, limit);

            if (!result.success) {
                logger.error('Failed to search events:', result.error);
                return errorResponse(res, 500, 'Failed to search events', result.error);
            }

            return response(res, 200, 'Events search completed successfully', {
                events: result.data,
                pagination: result.pagination,
                searchQuery: q.trim()
            });
        } catch (error) {
            logger.error('Error in lecturer searchEvents:', error.message);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get event statistics for lecturer's events
    static async getLecturerEventStats(req, res) {
        try {
            const lecturerId = req.user.id;
            const { id } = req.params; // Optional event ID

            let result;
            if (id) {
                // Get stats for a specific event if ID is provided
                const eventId = parseInt(id);
                const eventCheck = await Event.findById(eventId);
                if (!eventCheck.success || eventCheck.data.created_by !== lecturerId) {
                    return errorResponse(res, 403, 'Unauthorized to view stats for this event');
                }
                result = await Event.getEventStats(eventId);
            } else {
                // Get overall stats for events created by this lecturer
                const allEventsResult = await Event.findAll(1, 99999, { created_by: lecturerId });
                if (!allEventsResult.success) throw new Error(allEventsResult.error);

                const totalEvents = allEventsResult.pagination.total;
                const upcomingEvents = allEventsResult.data.filter(e => new Date(e.event_date) >= new Date()).length;
                const pastEvents = totalEvents - upcomingEvents;

                const monthlyEvents = {}; // Placeholder
                allEventsResult.data.forEach(event => {
                    const month = new Date(event.created_at).toISOString().substring(0, 7);
                    monthlyEvents[month] = (monthlyEvents[month] || 0) + 1;
                });

                result = { success: true, data: { totalEvents, upcomingEvents, pastEvents, monthlyEvents } };
            }

            if (!result.success) {
                logger.error('Failed to fetch lecturer event statistics:', result.error);
                return errorResponse(res, 500, 'Failed to fetch event statistics', result.error);
            }

            return response(res, 200, 'Event statistics retrieved successfully', result.data);
        } catch (error) {
            logger.error('Error in getLecturerEventStats:', error.message);
            return errorResponse(res, 500, 'Internal server error', error.message);
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
                return errorResponse(res, 400, 'Invalid event ID');
            }

            // Check if lecturer owns this event
            const eventCheck = await Event.findById(eventId);
            if (!eventCheck.success || eventCheck.data.created_by !== userId) {
                return errorResponse(res, 403, 'Unauthorized to view participants for this event');
            }

            const result = await Event.getEventParticipants(eventId, page, limit);

            if (!result.success) {
                logger.error('Failed to fetch event participants:', result.error);
                return errorResponse(res, 500, 'Failed to fetch event participants', result.error);
            }

            return response(res, 200, 'Event participants retrieved successfully', {
                participants: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            logger.error('Error in lecturer getEventParticipants:', error.message);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = LecturerEventController;
