const { supabase } = require('../../config/database');
const AvailabilityException = require('../../models/AvailabilityException');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

// Create availability exception for the authenticated staff member
const createException = async (req, res) => {
    try {
        const staffId = req.user.id;
        const { 
            exception_date, 
            exception_type = 'unavailable', 
            start_time, 
            end_time, 
            reason 
        } = req.body;

        // Validation
        if (!exception_date) {
            return errorResponse(res, 400, 'exception_date is required');
        }

        // Validate exception_date is a valid date
        const date = new Date(exception_date);
        if (isNaN(date.getTime())) {
            return errorResponse(res, 400, 'Invalid exception_date format');
        }

        // Validate exception_type
        const validTypes = ['unavailable', 'modified_hours', 'extra_hours'];
        if (!validTypes.includes(exception_type)) {
            return errorResponse(res, 400, 'Invalid exception_type. Must be one of: ' + validTypes.join(', '));
        }

        // If exception_type is 'modified_hours' or 'extra_hours', start_time and end_time are required
        if ((exception_type === 'modified_hours' || exception_type === 'extra_hours') && (!start_time || !end_time)) {
            return errorResponse(res, 400, 'start_time and end_time are required for modified_hours and extra_hours exceptions');
        }

        // Validate times if provided
        if (start_time && end_time) {
            if (start_time >= end_time) {
                return errorResponse(res, 400, 'End time must be after start time');
            }
        }

        const result = await AvailabilityException.create({
            staff_id: staffId,
            exception_date: exception_date,
            exception_type,
            start_time,
            end_time,
            reason
        });

        if (!result.success) {
            logger.error('Failed to create exception in DB:', result.error);
            return errorResponse(res, 400, result.error);
        }

        logger.info(`Exception created for staff_id: ${staffId}, date: ${exception_date}, type: ${exception_type}`);
        response(res, 201, 'Exception created successfully', result.data);
    } catch (error) {
        logger.error('Error creating exception:', error.message);
        logger.error('Error stack:', error.stack);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Get all exceptions for the authenticated staff member
const getExceptions = async (req, res) => {
    try {
        const staffId = req.user.id;
        const { start_date, end_date, exception_type } = req.query;

        let filters = { staff_id: staffId };
        
        if (start_date) {
            filters.start_date = start_date;
        }
        if (end_date) {
            filters.end_date = end_date;
        }
        if (exception_type) {
            filters.exception_type = exception_type;
        }

        const result = await AvailabilityException.getByStaff(staffId, filters);

        if (!result.success) {
            logger.error('Failed to fetch exceptions:', result.error);
            throw new Error(result.error);
        }

        response(res, 200, 'Exceptions fetched successfully', result.data);
    } catch (error) {
        logger.error('Error fetching exceptions:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Get upcoming exceptions for the authenticated staff member
const getUpcomingExceptions = async (req, res) => {
    try {
        const staffId = req.user.id;
        const { days_ahead = 30 } = req.query;

        const result = await AvailabilityException.getUpcoming(staffId, parseInt(days_ahead));

        if (!result.success) {
            logger.error('Failed to fetch upcoming exceptions:', result.error);
            throw new Error(result.error);
        }

        response(res, 200, 'Upcoming exceptions fetched successfully', result.data);
    } catch (error) {
        logger.error('Error fetching upcoming exceptions:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Update a specific exception owned by the authenticated staff member
const updateException = async (req, res) => {
    try {
        const staffId = req.user.id;
        const exceptionId = req.params.id;
        const updates = req.body;

        if (!exceptionId) {
            return errorResponse(res, 400, 'Invalid exception ID');
        }

        // Validate exception_type if provided
        if (updates.exception_type) {
            const validTypes = ['unavailable', 'modified_hours', 'extra_hours'];
            if (!validTypes.includes(updates.exception_type)) {
                return errorResponse(res, 400, 'Invalid exception_type. Must be one of: ' + validTypes.join(', '));
            }
        }

        // Validate times if both are provided
        if (updates.start_time && updates.end_time && updates.start_time >= updates.end_time) {
            return errorResponse(res, 400, 'End time must be after start time');
        }

        const result = await AvailabilityException.update(exceptionId, updates);
        if (!result.success) {
            return errorResponse(res, result.error.includes('not found') ? 404 : 403, result.error);
        }

        response(res, 200, 'Exception updated successfully', result.data);
    } catch (error) {
        logger.error('Error updating exception:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Delete a specific exception owned by the authenticated staff member
const deleteException = async (req, res) => {
    try {
        const staffId = req.user.id;
        const exceptionId = req.params.id;

        if (!exceptionId) {
            return errorResponse(res, 400, 'Invalid exception ID');
        }

        const result = await AvailabilityException.delete(exceptionId);
        if (!result.success) {
            return errorResponse(res, result.error.includes('not found') ? 404 : 403, result.error);
        }

        response(res, 200, 'Exception deleted successfully', result.data);
    } catch (error) {
        logger.error('Error deleting exception:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

module.exports = {
    createException,
    getExceptions,
    getUpcomingExceptions,
    updateException,
    deleteException
};
