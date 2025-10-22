const { supabase } = require('../../config/database');
const AvailabilityException = require('../../models/AvailabilityException');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

// Utility function to ensure time is in HH:MM:SS format
const formatTime = (time) => {
    if (!time) return null;
    const parts = time.split(':');
    if (parts.length >= 3) {
        return parts.slice(0, 3).join(':');
    }
    if (parts.length === 2) {
        return time + ':00';
    }
    return null;
};

// Create availability exception for the authenticated administrator
const createException = async (req, res) => {
    try {
        const adminId = req.user.id;
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

        // Normalize times
        const formattedStartTime = start_time ? formatTime(start_time) : null;
        const formattedEndTime = end_time ? formatTime(end_time) : null;

        // If exception_type is 'modified_hours' or 'extra_hours', start_time and end_time are required and validated
        if ((exception_type === 'modified_hours' || exception_type === 'extra_hours')) {
            if (!formattedStartTime || !formattedEndTime) {
                return errorResponse(res, 400, 'start_time and end_time are required for modified_hours and extra_hours exceptions');
            }
            if (formattedStartTime >= formattedEndTime) {
                return errorResponse(res, 400, 'End time must be after start time');
            }
        }

        // If times are provided for 'unavailable' (e.g., partial day off), validate them
        if (formattedStartTime && formattedEndTime && formattedStartTime >= formattedEndTime) {
            return errorResponse(res, 400, 'End time must be after start time');
        }

        const result = await AvailabilityException.create({
            staff_id: adminId,
            exception_date: exception_date,
            exception_type,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            reason
        });

        if (!result.success) {
            logger.error('Failed to create exception in DB:', result.error);
            return errorResponse(res, 400, result.error);
        }

        logger.info(`Exception created for administrator: ${adminId}, date: ${exception_date}, type: ${exception_type}`);
        response(res, 201, 'Exception created successfully', result.data);
    } catch (error) {
        logger.error('Error creating exception:', error.message);
        logger.error('Error stack:', error.stack);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Get all exceptions for the authenticated administrator
const getExceptions = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { start_date, end_date, exception_type } = req.query;

        const filters = {};

        if (start_date) {
            filters.start_date = start_date;
        }
        if (end_date) {
            filters.end_date = end_date;
        }
        if (exception_type) {
            filters.exception_type = exception_type;
        }

        const result = await AvailabilityException.getByStaff(adminId, filters);

        if (!result.success) {
            logger.error('Failed to fetch exceptions:', result.error);
            return errorResponse(res, 500, result.error);
        }

        response(res, 200, 'Exceptions fetched successfully', result.data);
    } catch (error) {
        logger.error('Error fetching exceptions:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Get upcoming exceptions for the authenticated administrator
const getUpcomingExceptions = async (req, res) => {
    try {
        const adminId = req.user.id;
        const { days_ahead = 30 } = req.query;

        const result = await AvailabilityException.getUpcoming(adminId, parseInt(days_ahead));

        if (!result.success) {
            logger.error('Failed to fetch upcoming exceptions:', result.error);
            return errorResponse(res, 500, result.error);
        }

        response(res, 200, 'Upcoming exceptions fetched successfully', result.data);
    } catch (error) {
        logger.error('Error fetching upcoming exceptions:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Update a specific exception owned by the authenticated administrator
const updateException = async (req, res) => {
    try {
        const adminId = req.user.id;
        const exceptionId = req.params.id;
        const updates = req.body;

        if (!exceptionId) {
            return errorResponse(res, 400, 'Invalid exception ID');
        }

        // Ensure ownership before attempting to update
        const existingResult = await AvailabilityException.getByIdAndStaff(exceptionId, adminId);
        if (!existingResult.success || !existingResult.data) {
            return errorResponse(res, 404, 'Exception not found or unauthorized');
        }
        const existingException = existingResult.data;

        // Determine the effective exception type and times for validation
        const effectiveType = updates.exception_type || existingException.exception_type;
        let effectiveStartTime = updates.start_time ? formatTime(updates.start_time) : existingException.start_time;
        let effectiveEndTime = updates.end_time ? formatTime(updates.end_time) : existingException.end_time;

        // Update the body with formatted times
        if (updates.start_time) updates.start_time = effectiveStartTime;
        if (updates.end_time) updates.end_time = effectiveEndTime;

        // Validate exception_type if provided
        if (updates.exception_type) {
            const validTypes = ['unavailable', 'modified_hours', 'extra_hours'];
            if (!validTypes.includes(updates.exception_type)) {
                return errorResponse(res, 400, 'Invalid exception_type. Must be one of: ' + validTypes.join(', '));
            }
        }

        // Conditional Time Validation based on effective type
        if ((effectiveType === 'modified_hours' || effectiveType === 'extra_hours')) {
            if (!effectiveStartTime || !effectiveEndTime) {
                return errorResponse(res, 400, `start_time and end_time are required for ${effectiveType} exceptions.`);
            }
            if (effectiveStartTime >= effectiveEndTime) {
                return errorResponse(res, 400, 'End time must be after start time');
            }
        } else if (effectiveStartTime && effectiveEndTime && effectiveStartTime >= effectiveEndTime) {
            return errorResponse(res, 400, 'End time must be after start time');
        }

        const result = await AvailabilityException.update(exceptionId, updates, adminId);

        if (!result.success) {
            return errorResponse(res, result.error.includes('not found') ? 404 : 403, result.error);
        }

        response(res, 200, 'Exception updated successfully', result.data);
    } catch (error) {
        logger.error('Error updating exception:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Delete a specific exception owned by the authenticated administrator
const deleteException = async (req, res) => {
    try {
        const adminId = req.user.id;
        const exceptionId = req.params.id;

        if (!exceptionId) {
            return errorResponse(res, 400, 'Invalid exception ID');
        }

        const result = await AvailabilityException.delete(exceptionId, adminId);

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
