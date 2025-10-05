const { supabase } = require('../../config/database');
const StaffAvailability = require('../../models/StaffAvailability');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

// Create availability slot for the authenticated administrator
const createAvailability = async (req, res) => {
    try {
        const staffId = req.user.id;
        const { day_of_week, start_time, end_time, break_start_time, break_end_time, max_appointments_per_slot, slot_duration_minutes, availability_type, valid_from, valid_to, is_active } = req.body;

        // Validation
        if (!day_of_week || !start_time || !end_time) {
            return errorResponse(res, 400, 'day_of_week, start_time, and end_time are required');
        }

        // Validate day_of_week is between 0 and 6
        const dayOfWeekNum = parseInt(day_of_week);
        if (isNaN(dayOfWeekNum) || dayOfWeekNum < 0 || dayOfWeekNum > 6) {
            return errorResponse(res, 400, 'day_of_week must be between 0 and 6 (0=Sunday, 6=Saturday)');
        }

        // Format time properly - handle both HH:MM and HH:MM:SS
        const formatTime = (time) => {
            if (!time) return null;
            const parts = time.split(':');
            if (parts.length >= 3) {
                // Take only HH:MM:SS
                return parts.slice(0, 3).join(':');
            }
            if (parts.length === 2) {
                // Append :00
                return time + ':00';
            }
            // Invalid format
            return null;
        };

        const formattedStartTime = formatTime(start_time);
        const formattedEndTime = formatTime(end_time);
        const formattedBreakStart = formatTime(break_start_time);
        const formattedBreakEnd = formatTime(break_end_time);

        // Validate times
        if (!formattedStartTime || !formattedEndTime) {
            return errorResponse(res, 400, 'Invalid time format. Use HH:MM or HH:MM:SS');
        }

        if (formattedStartTime >= formattedEndTime) {
            return errorResponse(res, 400, 'End time must be after start time');
        }

        // Validate break times if provided
        if (formattedBreakStart && formattedBreakEnd) {
            if (formattedBreakStart >= formattedBreakEnd) {
                return errorResponse(res, 400, 'Break end time must be after break start time');
            }
            if (formattedBreakStart < formattedStartTime || formattedBreakEnd > formattedEndTime) {
                return errorResponse(res, 400, 'Break must be within availability period');
            }
        } else if (formattedBreakStart || formattedBreakEnd) {
            return errorResponse(res, 400, 'Both break_start_time and break_end_time must be provided if using breaks');
        }

        // Validate and sanitize other fields
        const maxAppointments = Math.max(1, parseInt(max_appointments_per_slot) || 1);
        const slotDuration = Math.max(15, parseInt(slot_duration_minutes) || 30); // Minimum 15 minutes

        const availType = availability_type || 'regular';
        if (!['regular', 'temporary', 'special'].includes(availType)) {
            return errorResponse(res, 400, 'Invalid availability_type');
        }

        let validFromDate = null;
        if (valid_from) {
            validFromDate = new Date(valid_from);
            if (isNaN(validFromDate.getTime())) {
                return errorResponse(res, 400, 'Invalid valid_from date');
            }
        }

        let validToDate = null;
        if (valid_to) {
            validToDate = new Date(valid_to);
            if (isNaN(validToDate.getTime())) {
                return errorResponse(res, 400, 'Invalid valid_to date');
            }
            if (validFromDate && validToDate < validFromDate) {
                return errorResponse(res, 400, 'valid_to must be after valid_from');
            }
        }

        // Create the availability slot
        const result = await StaffAvailability.create({
            staff_id: staffId,
            day_of_week: dayOfWeekNum,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            break_start_time: formattedBreakStart,
            break_end_time: formattedBreakEnd,
            max_appointments_per_slot: maxAppointments,
            slot_duration_minutes: slotDuration,
            is_active: is_active !== undefined ? Boolean(is_active) : true,
            availability_type: availType,
            valid_from: validFromDate,
            valid_to: validToDate,
        });

        if (!result.success) {
            logger.error('Failed to create availability in DB:', result.error);
            return errorResponse(res, 400, result.error);
        }

        logger.info(`Availability slot created for administrator: ${staffId}, day: ${dayOfWeekNum}`);
        response(res, 201, 'Availability slot created successfully', result.data);
    } catch (error) {
        logger.error('Error creating availability:', error.message);
        logger.error('Error stack:', error.stack);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Get all availability slots for the authenticated administrator
const getMyAvailability = async (req, res) => {
    try {
        const staffId = req.user.id;
        const { day_of_week } = req.query;

        let result;
        if (day_of_week) {
            // Validate day_of_week
            const numericDayOfWeek = parseInt(day_of_week, 10);
            if (isNaN(numericDayOfWeek) || numericDayOfWeek < 1 || numericDayOfWeek > 7) {
                return errorResponse(res, 400, 'Invalid day_of_week. Must be a number between 1 and 7.');
            }
            result = await StaffAvailability.findByStaffIdAndDay(staffId, numericDayOfWeek);
        } else {
            result = await StaffAvailability.findByStaffId(staffId);
        }

        if (!result.success) {
            logger.error('Failed to fetch availability:', result.error);
            throw new Error(result.error);
        }

        response(res, 200, 'Administrator availability fetched successfully', result.data);
    } catch (error) {
        logger.error('Error fetching availability:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Update a specific availability slot owned by the authenticated administrator
const updateAvailability = async (req, res) => {
    try {
        const staffId = req.user.id;
        const slotId = req.params.id;
        const updates = req.body;

        if (!slotId) {
            return errorResponse(res, 400, 'Invalid slot ID');
        }

        // Format times if provided
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

        if (updates.start_time) updates.start_time = formatTime(updates.start_time);
        if (updates.end_time) updates.end_time = formatTime(updates.end_time);
        if (updates.break_start_time) updates.break_start_time = formatTime(updates.break_start_time);
        if (updates.break_end_time) updates.break_end_time = formatTime(updates.break_end_time);

        // Validate times if both start and end are provided
        if (updates.start_time && updates.end_time && updates.start_time >= updates.end_time) {
            return errorResponse(res, 400, 'End time must be after start time');
        }

        // Validate break times if provided
        if (updates.break_start_time && updates.break_end_time) {
            if (updates.break_start_time >= updates.break_end_time) {
                return errorResponse(res, 400, 'Break end time must be after break start time');
            }
        } else if (updates.break_start_time || updates.break_end_time) {
            return errorResponse(res, 400, 'Both break_start_time and break_end_time must be provided if updating breaks');
        }

        // Validate other fields if provided
        if (updates.max_appointments_per_slot) {
            updates.max_appointments_per_slot = Math.max(1, parseInt(updates.max_appointments_per_slot));
        }

        if (updates.slot_duration_minutes) {
            updates.slot_duration_minutes = Math.max(15, parseInt(updates.slot_duration_minutes));
        }

        if (updates.availability_type && !['regular', 'temporary', 'special'].includes(updates.availability_type)) {
            return errorResponse(res, 400, 'Invalid availability_type');
        }

        if (updates.valid_from) {
            const validFromDate = new Date(updates.valid_from);
            if (isNaN(validFromDate.getTime())) {
                return errorResponse(res, 400, 'Invalid valid_from date');
            }
            updates.valid_from = validFromDate;
        }

        if (updates.valid_to) {
            const validToDate = new Date(updates.valid_to);
            if (isNaN(validToDate.getTime())) {
                return errorResponse(res, 400, 'Invalid valid_to date');
            }
            updates.valid_to = validToDate;
            if (updates.valid_from && updates.valid_to < updates.valid_from) {
                return errorResponse(res, 400, 'valid_to must be after valid_from');
            }
        }

        const result = await StaffAvailability.update(slotId, updates);
        if (!result.success) {
            return errorResponse(res, result.error.includes('not found') ? 404 : 403, result.error);
        }

        response(res, 200, 'Availability slot updated successfully', result.data);
    } catch (error) {
        logger.error('Error updating availability:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Delete a specific availability slot owned by the authenticated administrator
const deleteAvailability = async (req, res) => {
    try {
        const staffId = req.user.id;
        const slotId = req.params.id;

        if (!slotId) {
            return errorResponse(res, 400, 'Invalid slot ID');
        }

        const result = await StaffAvailability.delete(slotId);
        if (!result.success) {
            return errorResponse(res, result.error.includes('not found') ? 404 : 403, result.error);
        }

        response(res, 200, 'Availability slot deleted successfully', result.data);
    } catch (error) {
        logger.error('Error deleting availability:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

module.exports = {
    createAvailability,
    getMyAvailability,
    updateAvailability,
    deleteAvailability
};
