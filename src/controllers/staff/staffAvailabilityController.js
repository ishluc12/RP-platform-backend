const StaffAvailability = require('../../models/StaffAvailability');
const AvailabilityException = require('../../models/AvailabilityException');
const { response, errorResponse } = require('../../utils/responseHandlers');
const logger = require('../../utils/logger');

class StaffAvailabilityController {
    /**
     * Create availability slot
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async createAvailability(req, res) {
        try {
            const {
                day_of_week,
                start_time,
                end_time,
                break_start_time,
                break_end_time,
                slot_duration_minutes,
                max_appointments_per_slot,
                buffer_time_minutes,
                availability_type,
                valid_from,
                valid_to
            } = req.body;

            const staff_id = req.user.id;

            // Validate required fields
            if (day_of_week === undefined || !start_time || !end_time) {
                return errorResponse(res, 400, 'Missing required fields: day_of_week, start_time, end_time');
            }

            // Validate day_of_week (0-6)
            if (day_of_week < 0 || day_of_week > 6) {
                return errorResponse(res, 400, 'day_of_week must be between 0 (Sunday) and 6 (Saturday)');
            }

            const availabilityData = {
                staff_id,
                day_of_week,
                start_time,
                end_time,
                break_start_time,
                break_end_time,
                slot_duration_minutes,
                max_appointments_per_slot,
                buffer_time_minutes,
                availability_type,
                valid_from,
                valid_to
            };

            const result = await StaffAvailability.create(availabilityData);

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Staff ${staff_id} created availability slot ${result.data.id}`);
            response(res, 201, 'Availability slot created successfully', result.data);
        } catch (error) {
            logger.error('Error creating availability:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Get staff's availability
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getMyAvailability(req, res) {
    try {
        const staffId = req.user.id;
            const { is_active, day_of_week, availability_type } = req.query;

            const filters = {};
            if (is_active !== undefined) filters.is_active = is_active === 'true';
            if (day_of_week !== undefined) filters.day_of_week = parseInt(day_of_week);
            if (availability_type) filters.availability_type = availability_type;

            const result = await StaffAvailability.getByStaff(staffId, filters);

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Availability fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching availability:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Update availability slot
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async updateAvailability(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const staffId = req.user.id;

            // First check if this availability belongs to the staff
            const availabilityResult = await StaffAvailability.getByStaff(staffId);
            if (!availabilityResult.success) {
                return errorResponse(res, 500, availabilityResult.error);
            }

            const availability = availabilityResult.data.find(a => a.id === id);
            if (!availability) {
                return errorResponse(res, 404, 'Availability slot not found');
            }

            const result = await StaffAvailability.update(id, updateData);

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Staff ${staffId} updated availability slot ${id}`);
            response(res, 200, 'Availability slot updated successfully', result.data);
        } catch (error) {
            logger.error('Error updating availability:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Delete availability slot
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async deleteAvailability(req, res) {
        try {
            const { id } = req.params;
            const staffId = req.user.id;

            // First check if this availability belongs to the staff
            const availabilityResult = await StaffAvailability.getByStaff(staffId);
            if (!availabilityResult.success) {
                return errorResponse(res, 500, availabilityResult.error);
            }

            const availability = availabilityResult.data.find(a => a.id === id);
            if (!availability) {
                return errorResponse(res, 404, 'Availability slot not found');
            }

            const result = await StaffAvailability.delete(id);

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Staff ${staffId} deleted availability slot ${id}`);
            response(res, 200, 'Availability slot deleted successfully');
        } catch (error) {
            logger.error('Error deleting availability:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Toggle availability slot active status
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async toggleAvailability(req, res) {
        try {
            const { id } = req.params;
            const { is_active } = req.body;
            const staffId = req.user.id;

            // First check if this availability belongs to the staff
            const availabilityResult = await StaffAvailability.getByStaff(staffId);
            if (!availabilityResult.success) {
                return errorResponse(res, 500, availabilityResult.error);
            }

            const availability = availabilityResult.data.find(a => a.id === id);
            if (!availability) {
                return errorResponse(res, 404, 'Availability slot not found');
            }

            const result = await StaffAvailability.toggleActive(id, is_active);

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Staff ${staffId} toggled availability slot ${id} to ${is_active ? 'active' : 'inactive'}`);
            response(res, 200, 'Availability status updated successfully', result.data);
    } catch (error) {
            logger.error('Error toggling availability:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Bulk create availability slots
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async bulkCreateAvailability(req, res) {
        try {
            const { slots } = req.body;
        const staffId = req.user.id;

            if (!slots || !Array.isArray(slots) || slots.length === 0) {
                return errorResponse(res, 400, 'Slots array is required');
            }

            // Validate each slot
            for (const slot of slots) {
                if (slot.day_of_week === undefined || !slot.start_time || !slot.end_time) {
                    return errorResponse(res, 400, 'Each slot must have day_of_week, start_time, and end_time');
                }
                if (slot.day_of_week < 0 || slot.day_of_week > 6) {
                    return errorResponse(res, 400, 'day_of_week must be between 0 (Sunday) and 6 (Saturday)');
                }
            }

            const result = await StaffAvailability.bulkCreate(staffId, slots);

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Staff ${staffId} bulk created ${slots.length} availability slots`);
            response(res, 201, 'Availability slots created successfully', result.data);
        } catch (error) {
            logger.error('Error bulk creating availability:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Get availability summary
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getAvailabilitySummary(req, res) {
        try {
            const staffId = req.user.id;
            const result = await StaffAvailability.getSummary(staffId);

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Availability summary fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching availability summary:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Create availability exception
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async createException(req, res) {
        try {
            const {
                exception_date,
                exception_type,
                start_time,
                end_time,
                reason,
                is_recurring
            } = req.body;

            const staff_id = req.user.id;

            // Validate required fields
            if (!exception_date) {
                return errorResponse(res, 400, 'Missing required field: exception_date');
            }

            const exceptionData = {
                staff_id,
                exception_date,
                exception_type,
                start_time,
                end_time,
                reason,
                is_recurring
            };

            const result = await AvailabilityException.create(exceptionData);

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Staff ${staff_id} created availability exception ${result.data.id}`);
            response(res, 201, 'Availability exception created successfully', result.data);
        } catch (error) {
            logger.error('Error creating availability exception:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Get availability exceptions
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getExceptions(req, res) {
    try {
        const staffId = req.user.id;
            const { exception_type, start_date, end_date, is_recurring } = req.query;

            const filters = {};
            if (exception_type) filters.exception_type = exception_type;
            if (start_date) filters.start_date = start_date;
            if (end_date) filters.end_date = end_date;
            if (is_recurring !== undefined) filters.is_recurring = is_recurring === 'true';

            const result = await AvailabilityException.getByStaff(staffId, filters);

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Availability exceptions fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching availability exceptions:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Update availability exception
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async updateException(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;
            const staffId = req.user.id;

            // First check if this exception belongs to the staff
            const exceptionResult = await AvailabilityException.getByStaff(staffId);
            if (!exceptionResult.success) {
                return errorResponse(res, 500, exceptionResult.error);
            }

            const exception = exceptionResult.data.find(e => e.id === id);
            if (!exception) {
                return errorResponse(res, 404, 'Availability exception not found');
            }

            const result = await AvailabilityException.update(id, updateData);

        if (!result.success) {
                return errorResponse(res, 400, result.error);
        }

            logger.info(`Staff ${staffId} updated availability exception ${id}`);
            response(res, 200, 'Availability exception updated successfully', result.data);
    } catch (error) {
            logger.error('Error updating availability exception:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Delete availability exception
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async deleteException(req, res) {
        try {
            const { id } = req.params;
            const staffId = req.user.id;

            // First check if this exception belongs to the staff
            const exceptionResult = await AvailabilityException.getByStaff(staffId);
            if (!exceptionResult.success) {
                return errorResponse(res, 500, exceptionResult.error);
            }

            const exception = exceptionResult.data.find(e => e.id === id);
            if (!exception) {
                return errorResponse(res, 404, 'Availability exception not found');
            }

            const result = await AvailabilityException.delete(id);

        if (!result.success) {
                return errorResponse(res, 400, result.error);
        }

            logger.info(`Staff ${staffId} deleted availability exception ${id}`);
            response(res, 200, 'Availability exception deleted successfully');
    } catch (error) {
            logger.error('Error deleting availability exception:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Get upcoming exceptions
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getUpcomingExceptions(req, res) {
        try {
            const staffId = req.user.id;
            const { days = 30 } = req.query;

            const result = await AvailabilityException.getUpcoming(staffId, parseInt(days));

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Upcoming exceptions fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching upcoming exceptions:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }
}

module.exports = StaffAvailabilityController;