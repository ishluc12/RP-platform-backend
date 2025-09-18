// D:\final-year-project\backend\src\controllers\shared\eventController.js
const Event = require('../../models/Event');
const NotificationModel = require('../../models/Notification');
const User = require('../../models/User');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

// --- Event Management ---

/**
 * Create a new event.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createEvent = async (req, res) => {
    const { title, description, event_date, location, max_participants, registration_required, department, is_college_wide } = req.body;
    const created_by = req.user.id;

    if (!title || !event_date || !location) {
        return errorResponse(res, 400, 'Title, event date, and location are required.');
    }

    try {
        const result = await Event.create({ title, description, event_date, location, created_by, max_participants, registration_required, department, is_college_wide });
        if (!result.success) {
            logger.error('Error creating event in controller:', result.error);
            return errorResponse(res, 400, result.error.message || 'Failed to create event');
        }

        const newEvent = result.data;

        // Create notifications for the new event
        if (newEvent.is_college_wide) {
            // Notify all users
            const allUsersResult = await User.findAll(1, 1000); // Fetch a reasonable limit of users
            if (allUsersResult.success && allUsersResult.data.length > 0) {
                for (const user of allUsersResult.data) {
                    await NotificationModel.createNotification({
                        user_id: user.id,
                        type: 'event_college_wide_new',
                        content: `New college-wide event: ${newEvent.title} on ${new Date(newEvent.event_date).toLocaleDateString()}`,
                        source_id: newEvent.id,
                        source_table: 'events',
                    });
                }
            }
        } else if (newEvent.department) {
            // Notify users in the specific department
            const departmentUsersResult = await User.findAll(1, 1000, { department: newEvent.department });
            if (departmentUsersResult.success && departmentUsersResult.data.length > 0) {
                for (const user of departmentUsersResult.data) {
                    await NotificationModel.createNotification({
                        user_id: user.id,
                        type: 'event_department_new',
                        content: `New department event: ${newEvent.title} on ${new Date(newEvent.event_date).toLocaleDateString()}`,
                        source_id: newEvent.id,
                        source_table: 'events',
                    });
                }
            }
        }

        response(res, 201, 'Event created successfully', result.data);
    } catch (error) {
        logger.error('Exception creating event:', error.message);
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get all events with optional filters and pagination.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getAllEvents = async (req, res) => {
    const { page, limit, title, location, created_by, event_date_from, event_date_to } = req.query;
    const filters = {};
    if (title) filters.title = title;
    if (location) filters.location = location;
    if (created_by) filters.created_by = created_by;
    if (event_date_from) filters.event_date_from = event_date_from;
    if (event_date_to) filters.event_date_to = event_date_to;

    try {
        const result = await Event.findAll(parseInt(page) || 1, parseInt(limit) || 10, filters);
        if (!result.success) {
            logger.error('Error fetching all events in controller:', result.error);
            return errorResponse(res, 400, result.error.message || 'Failed to fetch events');
        }
        response(res, 200, 'Events fetched successfully', result.data, result.pagination);
    } catch (error) {
        logger.error('Exception fetching all events:', error.message);
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get a single event by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getEventById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Event.findById(id);
        if (!result.success) {
            logger.error('Error fetching event by ID in controller:', result.error);
            return errorResponse(res, result.error === 'Event not found' ? 404 : 400, result.error.message || result.error);
        }
        response(res, 200, 'Event fetched successfully', result.data);
    } catch (error) {
        logger.error('Exception fetching event by ID:', error.message);
        errorResponse(res, 500, error.message);
    }
};

/**
 * Update an existing event.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateEvent = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const userId = req.user.id;

    try {
        // First, check if the user is the creator of the event
        const eventResult = await Event.findById(id);
        if (!eventResult.success || eventResult.data.created_by !== userId) {
            return errorResponse(res, 403, 'Unauthorized to update this event');
        }

        const result = await Event.update(id, updates);
        if (!result.success) {
            logger.error('Error updating event in controller:', result.error);
            return errorResponse(res, 400, result.error.message || 'Failed to update event');
        }

        const updatedEvent = result.data;

        // Notification logic for updated event
        const oldEvent = eventResult.data; // eventResult was fetched earlier

        // Check for changes in college-wide status or department
        const isCollegeWideChanged = oldEvent.is_college_wide !== updatedEvent.is_college_wide;
        const departmentChanged = oldEvent.department !== updatedEvent.department;
        const eventDetailsChanged = oldEvent.title !== updatedEvent.title || oldEvent.event_date !== updatedEvent.event_date;

        if (isCollegeWideChanged && updatedEvent.is_college_wide) {
            // Event became college-wide or was college-wide and changed
            const allUsersResult = await User.findAll(1, 1000);
            if (allUsersResult.success && allUsersResult.data.length > 0) {
                for (const user of allUsersResult.data) {
                    await NotificationModel.createNotification({
                        user_id: user.id,
                        type: 'event_college_wide_update',
                        content: `College-wide event updated: ${updatedEvent.title} on ${new Date(updatedEvent.event_date).toLocaleDateString()}`,
                        source_id: updatedEvent.id,
                        source_table: 'events',
                    });
                }
            }
        } else if (departmentChanged || (updatedEvent.department && !oldEvent.department)) {
            // Event changed department or became department-specific
            const targetDepartment = updatedEvent.department || oldEvent.department;
            if (targetDepartment) {
                const departmentUsersResult = await User.findAll(1, 1000, { department: targetDepartment });
                if (departmentUsersResult.success && departmentUsersResult.data.length > 0) {
                    for (const user of departmentUsersResult.data) {
                        await NotificationModel.createNotification({
                            user_id: user.id,
                            type: 'event_department_update',
                            content: `Department event updated: ${updatedEvent.title} on ${new Date(updatedEvent.event_date).toLocaleDateString()} (Department: ${targetDepartment})`,
                            source_id: updatedEvent.id,
                            source_table: 'events',
                        });
                    }
                }
            }
        } else if (eventDetailsChanged) {
            // Generic update notification for event participants if no other specific notification was sent
            const participantsResult = await Event.getEventParticipants(id); // Assuming this fetches user_ids
            if (participantsResult.success && participantsResult.data.length > 0) {
                for (const participant of participantsResult.data) {
                    await NotificationModel.createNotification({
                        user_id: participant.user_id,
                        type: 'event_update_generic',
                        content: `Event you RSVP'd to has been updated: ${updatedEvent.title} on ${new Date(updatedEvent.event_date).toLocaleDateString()}`,
                        source_id: updatedEvent.id,
                        source_table: 'events',
                    });
                }
            }
        }

        response(res, 200, 'Event updated successfully', result.data);
    } catch (error) {
        logger.error('Exception updating event:', error.message);
        errorResponse(res, 500, error.message);
    }
};

/**
 * Delete an event.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const deleteEvent = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;

    try {
        // First, check if the user is the creator of the event
        const eventResult = await Event.findById(id);
        if (!eventResult.success || eventResult.data.created_by !== userId) {
            return errorResponse(res, 403, 'Unauthorized to delete this event');
        }

        const result = await Event.delete(id);
        if (!result.success) {
            logger.error('Error deleting event in controller:', result.error);
            return errorResponse(res, 400, result.error.message || 'Failed to delete event');
        }
        response(res, 200, 'Event deleted successfully', result.data);
    } catch (error) {
        logger.error('Exception deleting event:', error.message);
        errorResponse(res, 500, error.message);
    }
};

// --- Event Participation (RSVP) ---

/**
 * RSVP to an event.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const rsvpToEvent = async (req, res) => {
    const { eventId } = req.params;
    const { status } = req.body; // e.g., 'going', 'interested', 'not going'
    const userId = req.user.id;

    if (!status || !['interested', 'going', 'not going'].includes(status)) {
        return errorResponse(res, 400, 'Invalid RSVP status.');
    }

    try {
        const result = await Event.rsvpToEvent(eventId, userId, status);
        if (!result.success) {
            logger.error('Error RSVPing to event in controller:', result.error);
            return errorResponse(res, 400, result.error.message || 'Failed to RSVP to event');
        }
        response(res, 200, `RSVP ${result.action} successfully`, result.data);
    } catch (error) {
        logger.error('Exception RSVPing to event:', error.message);
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get participants for a specific event.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getEventParticipants = async (req, res) => {
    const { eventId } = req.params;
    const { page, limit } = req.query;

    try {
        const result = await Event.getEventParticipants(eventId, parseInt(page) || 1, parseInt(limit) || 20);
        if (!result.success) {
            logger.error('Error fetching event participants in controller:', result.error);
            return errorResponse(res, 400, result.error.message || 'Failed to fetch participants');
        }
        response(res, 200, 'Event participants fetched successfully', result.data, result.pagination);
    } catch (error) {
        logger.error('Exception fetching event participants:', error.message);
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get current user's RSVP status for an event.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getUserRsvpStatus = async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.id;

    try {
        const result = await Event.getUserRsvpStatus(eventId, userId);
        if (!result.success) {
            logger.error('Error fetching user RSVP status in controller:', result.error);
            return errorResponse(res, 400, result.error.message || 'Failed to fetch RSVP status');
        }
        response(res, 200, 'User RSVP status fetched successfully', { status: result.status });
    } catch (error) {
        logger.error('Exception fetching user RSVP status:', error.message);
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get all events the current user has RSVP'd to.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getUserRsvpEvents = async (req, res) => {
    const userId = req.user.id;
    const { page, limit } = req.query;

    try {
        const result = await Event.getUserRsvpEvents(userId, parseInt(page) || 1, parseInt(limit) || 10);
        if (!result.success) {
            logger.error('Error fetching user RSVP events in controller:', result.error);
            return errorResponse(res, 400, result.error.message || 'Failed to fetch RSVP\'s');
        }
        response(res, 200, 'User RSVP events fetched successfully', result.data, result.pagination);
    } catch (error) {
        logger.error('Exception fetching user RSVP events:', error.message);
        errorResponse(res, 500, error.message);
    }
};

/**
 * Remove user's RSVP from an event.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const removeRsvp = async (req, res) => {
    const { eventId } = req.params;
    const userId = req.user.id;

    try {
        const result = await Event.removeRsvp(eventId, userId);
        if (!result.success) {
            logger.error('Error removing RSVP in controller:', result.error);
            return errorResponse(res, 400, result.error.message || 'Failed to remove RSVP');
        }
        response(res, 200, 'RSVP removed successfully', result.data);
    } catch (error) {
        logger.error('Exception removing RSVP:', error.message);
        errorResponse(res, 500, error.message);
    }
};

module.exports = {
    createEvent,
    getAllEvents,
    getEventById,
    updateEvent,
    deleteEvent,
    rsvpToEvent,
    getEventParticipants,
    getUserRsvpStatus,
    getUserRsvpEvents,
    removeRsvp
};