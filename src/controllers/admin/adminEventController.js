const { supabase } = require('../../config/database');
const Event = require('../../models/Event');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class AdminEventController {
    static async createEvent(req, res) {
        try {
            const {
                title,
                description,
                event_date,
                location,
                max_participants,
                registration_required,
                target_audience
            } = req.body;

            const created_by = req.user?.id || req.user?.user_id;

            if (!created_by) {
                return errorResponse(res, 401, 'User not authenticated');
            }

            if (!title || !event_date || !location) {
                return errorResponse(res, 400, 'Title, event date, and location are required');
            }

            const validTargetAudiences = [
                'all',
                'Civil Engineering',
                'Creative Arts',
                'Mechanical Engineering',
                'Electrical & Electronics Engineering',
                'Information & Communication Technology (ICT)',
                'Mining Engineering',
                'Transport and Logistics'
            ];

            if (target_audience && !validTargetAudiences.includes(target_audience)) {
                return errorResponse(res, 400, `Invalid target_audience. Must be one of: ${validTargetAudiences.join(', ')}.`);
            }

            const eventData = {
                title: title.trim(),
                description: description?.trim() || null,
                event_date,
                location: location.trim(),
                created_by,
                max_participants: max_participants ? parseInt(max_participants) : null,
                registration_required: !!registration_required,
                target_audience: target_audience || 'all'
            };

            const result = await Event.create(eventData);

            if (!result.success) {
                logger.error('Failed to create event:', result.error);
                return errorResponse(res, 500, 'Failed to create event', result.error);
            }

            return response(res, 201, 'Event created successfully', result.data);
        } catch (error) {
            logger.error('Error in admin createEvent:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    static async getAllEvents(req, res) {
        try {
            const { page, limit, title, location, created_by, event_date_from, event_date_to, target_audience } = req.query;
            const userRole = req.user?.role;
            const userDepartment = req.user?.department;

            const filters = {};
            if (title) filters.title = title;
            if (location) filters.location = location;
            if (created_by) filters.created_by = created_by;
            if (event_date_from) filters.event_date_from = event_date_from;
            if (event_date_to) filters.event_date_to = event_date_to;
            if (target_audience) filters.target_audience = target_audience;

            const result = await Event.findAll(
                parseInt(page) || 1,
                parseInt(limit) || 10,
                filters,
                userRole,
                userDepartment
            );

            if (!result.success) {
                logger.error('Error fetching all events in controller:', result.error);
                return errorResponse(res, 400, result.error || 'Failed to fetch events');
            }
            
            return response(res, 200, 'Events fetched successfully', result.data, result.pagination);
        } catch (error) {
            logger.error('Exception fetching all events:', error.message);
            return errorResponse(res, 500, error.message);
        }
    }

    static async getEventStats(req, res) {
        try {
            const { id } = req.params;
            const result = await Event.getEventStats(id || null);
            
            if (!result.success) {
                return errorResponse(res, 404, result.error);
            }
            
            return response(res, 200, 'Event stats fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching event stats:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    static async getEventsWithAdvancedFilters(req, res) {
        try {
            const filters = req.query;
            const userRole = req.user?.role;
            const userDepartment = req.user?.department;
            
            const result = await Event.findAll(
                parseInt(filters.page) || 1,
                parseInt(filters.limit) || 10,
                filters,
                userRole,
                userDepartment
            );
            
            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }
            
            return response(res, 200, 'Events fetched successfully', result.data, result.pagination);
        } catch (error) {
            logger.error('Error fetching events with advanced filters:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    static async getEventsByUser(req, res) {
        try {
            const { userId } = req.params;
            const { page, limit } = req.query;
            
            const result = await Event.findByCreator(
                userId,
                parseInt(page) || 1,
                parseInt(limit) || 10
            );
            
            if (!result.success) {
                return errorResponse(res, 404, result.error);
            }
            
            return response(res, 200, 'User events fetched successfully', result.data, result.pagination);
        } catch (error) {
            logger.error('Error fetching events by user:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    static async updateEvent(req, res) {
        try {
            const { id } = req.params;
            const updates = req.body;
            
            const result = await Event.update(id, updates);
            
            if (!result.success) {
                return errorResponse(res, 404, result.error);
            }
            
            return response(res, 200, 'Event updated successfully', result.data);
        } catch (error) {
            logger.error('Error updating event:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    static async deleteEvent(req, res) {
        try {
            const { id } = req.params;
            const result = await Event.delete(id);
            
            if (!result.success) {
                return errorResponse(res, 404, result.error);
            }
            
            return response(res, 200, 'Event deleted successfully');
        } catch (error) {
            logger.error('Error deleting event:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    static async bulkDeleteEvents(req, res) {
        try {
            const { event_ids } = req.body;
            
            if (!event_ids || !Array.isArray(event_ids) || event_ids.length === 0) {
                return errorResponse(res, 400, 'event_ids array is required');
            }
            
            const { data, error } = await supabase
                .from('events')
                .delete()
                .in('id', event_ids)
                .select();
            
            if (error) {
                logger.error('Error bulk deleting events:', error);
                return errorResponse(res, 400, error.message);
            }
            
            return response(res, 200, 'Events deleted successfully', { deleted_count: data.length });
        } catch (error) {
            logger.error('Error bulk deleting events:', error);
            return errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = AdminEventController;
