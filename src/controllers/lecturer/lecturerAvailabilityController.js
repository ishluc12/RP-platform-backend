const { supabase } = require('../../config/database');
const StaffAvailability = require('../../models/StaffAvailability');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

// Create availability slot for the authenticated staff member
const createAvailability = async (req, res) => {
    try {
        const staffId = req.user.id;
        const { day_of_week, start_time, end_time, break_start_time, break_end_time, max_appointments_per_slot = 1, slot_duration_minutes = 30, availability_type = 'regular', valid_from, valid_to, is_active = true } = req.body;

        // Normalize valid_from and valid_to to null if not provided or empty
        const normalizedValidFrom = valid_from === '' ? null : valid_from;
        const normalizedValidTo = valid_to === '' ? null : valid_to;

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
                return parts.slice(0, 3).join(':');
            }
            if (parts.length === 2) {
                return time + ':00';
            }
            return null;
        };

        const formattedStartTime = formatTime(start_time);
        const formattedEndTime = formatTime(end_time);
        const formattedBreakStart = break_start_time ? formatTime(break_start_time) : null;
        const formattedBreakEnd = break_end_time ? formatTime(break_end_time) : null;

        // Validate times
        if (!formattedStartTime || !formattedEndTime) {
            return errorResponse(res, 400, 'Invalid time format for start_time or end_time. Use HH:MM or HH:MM:SS');
        }

        if (formattedStartTime >= formattedEndTime) {
            return errorResponse(res, 400, 'End time must be after start time');
        }

        if (formattedBreakStart && formattedBreakEnd) {
            if (formattedBreakStart >= formattedBreakEnd) {
                return errorResponse(res, 400, 'Break end time must be after break start time');
            }
            if (formattedBreakStart < formattedStartTime || formattedBreakEnd > formattedEndTime) {
                return errorResponse(res, 400, 'Break times must be within start and end times');
            }
        } else if (formattedBreakStart || formattedBreakEnd) {
            return errorResponse(res, 400, 'Both break_start_time and break_end_time must be provided if using break');
        }

        // Validate valid_from and valid_to if provided
        if (valid_from && valid_to) {
            const fromDate = new Date(valid_from);
            const toDate = new Date(valid_to);
            if (fromDate >= toDate) {
                return errorResponse(res, 400, 'valid_to must be after valid_from');
            }
        }

        // Validate max_appointments_per_slot and slot_duration_minutes
        const maxAppts = parseInt(max_appointments_per_slot);
        const slotDuration = parseInt(slot_duration_minutes);
        if (isNaN(maxAppts) || maxAppts < 1) {
            return errorResponse(res, 400, 'max_appointments_per_slot must be at least 1');
        }
        if (isNaN(slotDuration) || slotDuration < 1) {
            return errorResponse(res, 400, 'slot_duration_minutes must be at least 1');
        }

        const result = await StaffAvailability.create({
            staff_id: staffId,
            day_of_week: dayOfWeekNum,
            start_time: formattedStartTime,
            end_time: formattedEndTime,
            break_start_time: formattedBreakStart,
            break_end_time: formattedBreakEnd,
            max_appointments_per_slot: maxAppts,
            slot_duration_minutes: slotDuration,
            availability_type,
            valid_from: normalizedValidFrom,
            valid_to: normalizedValidTo,
            is_active: Boolean(is_active)
        });

        if (!result.success) {
            logger.error('Failed to create availability in DB:', result.error);
            return errorResponse(res, 400, result.error);
        }

        logger.info(`Availability slot created for staff_id: ${staffId}, role: ${req.user.role}, day: ${dayOfWeekNum}`);
        response(res, 201, 'Availability slot created successfully', result.data);
    } catch (error) {
        logger.error('Error creating availability:', error.message);
        logger.error('Error stack:', error.stack);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Get all availability slots for the authenticated staff member
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

        response(res, 200, 'Staff availability fetched successfully', result.data);
    } catch (error) {
        logger.error('Error fetching availability:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Update a specific availability slot owned by the authenticated staff member
const updateAvailability = async (req, res) => {
    try {
        const staffId = req.user.id;
        const slotId = req.params.id;
        const updates = req.body;

        if (!slotId) {
            return errorResponse(res, 400, 'Invalid slot ID');
        }

        // Format times if provided
        if (updates.start_time) {
            const parts = updates.start_time.split(':');
            if (parts.length === 2) {
                updates.start_time = updates.start_time + ':00';
            }
        }

        if (updates.end_time) {
            const parts = updates.end_time.split(':');
            if (parts.length === 2) {
                updates.end_time = updates.end_time + ':00';
            }
        }

        // Validate times if both are provided
        if (updates.start_time && updates.end_time && updates.start_time >= updates.end_time) {
            return errorResponse(res, 400, 'End time must be after start time');
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

// Delete a specific availability slot owned by the authenticated staff member
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

// Get all active availability slots for students (no authentication required)
const getLecturerAvailabilityForStudents = async (req, res) => {
    try {
        // Fetch all active staff availability (includes both lecturers and administrators)
        const result = await StaffAvailability.getAllActiveStaffAvailability();

        if (!result.success) {
            logger.error('Failed to fetch staff availability:', result.error);
            throw new Error(result.error);
        }

        response(res, 200, 'Staff availability fetched successfully', result.data);
    } catch (error) {
        logger.error('Error fetching staff availability for students:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

module.exports = {
    createAvailability,
    getMyAvailability,
    updateAvailability,
    deleteAvailability,
    getLecturerAvailabilityForStudents
};
