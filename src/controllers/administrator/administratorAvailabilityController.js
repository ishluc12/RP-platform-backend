const { supabase } = require('../../config/database');
const StaffAvailability = require('../../models/StaffAvailability');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

// --- SHARED UTILITY FUNCTION (Normally in utils/timeFormatter.js) ---
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
// -------------------------------------------------------------------

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
        const slotDuration = Math.max(15, parseInt(slot_duration_minutes) || 30); // Minimum 15 minutes (schema check)

        const availType = availability_type || 'regular';
        // Note: The schema also allows 'emergency', but the controller validates against the common three.
        if (!['regular', 'temporary', 'special', 'emergency'].includes(availType)) {
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
            // Assuming 409 Conflict for duplicate or constraint error
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
            if (isNaN(numericDayOfWeek) || numericDayOfWeek < 0 || numericDayOfWeek > 6) {
                return errorResponse(res, 400, 'Invalid day_of_week. Must be a number between 0 and 6 (0=Sunday, 6=Saturday).');
            }
            result = await StaffAvailability.findByStaffIdAndDay(staffId, numericDayOfWeek);
        } else {
            result = await StaffAvailability.findByStaffId(staffId);
        }

        if (!result.success) {
            logger.error('Failed to fetch availability:', result.error);
            // This throw will be caught by the outer catch block
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

        // 1. Fetch the existing availability slot to apply composite validation
        const existingSlotResult = await StaffAvailability.findOne(slotId);
        if (!existingSlotResult.success || !existingSlotResult.data) {
            return errorResponse(res, 404, 'Availability slot not found');
        }
        const existingSlot = existingSlotResult.data;

        // Enforce ownership: Check if the slot belongs to the authenticated staff
        if (existingSlot.staff_id !== staffId) {
            return errorResponse(res, 403, 'Forbidden: You do not own this availability slot');
        }

        // Format times if provided, and check against existing times for composite validation
        const effectiveStartTime = updates.start_time ? formatTime(updates.start_time) : existingSlot.start_time;
        const effectiveEndTime = updates.end_time ? formatTime(updates.end_time) : existingSlot.end_time;
        const effectiveBreakStart = updates.break_start_time ? formatTime(updates.break_start_time) : existingSlot.break_start_time;
        const effectiveBreakEnd = updates.break_end_time ? formatTime(updates.break_end_time) : existingSlot.break_end_time;

        // Apply formatted times back to updates object
        if (updates.start_time) updates.start_time = effectiveStartTime;
        if (updates.end_time) updates.end_time = effectiveEndTime;
        if (updates.break_start_time) updates.break_start_time = effectiveBreakStart;
        if (updates.break_end_time) updates.break_end_time = effectiveBreakEnd;


        // Validate times
        if (effectiveStartTime && effectiveEndTime && effectiveStartTime >= effectiveEndTime) {
            return errorResponse(res, 400, 'End time must be after start time');
        }

        // Validate break times (CRITICAL FIX: Uses effective times)
        const breakStartProvided = updates.break_start_time !== undefined;
        const breakEndProvided = updates.break_end_time !== undefined;

        if (breakStartProvided || breakEndProvided || (existingSlot.break_start_time && existingSlot.break_end_time)) {
            // If any break field is provided, or if the slot already has a break:
            if (!effectiveBreakStart || !effectiveBreakEnd) {
                return errorResponse(res, 400, 'Both break_start_time and break_end_time must be provided or updated together');
            }

            if (effectiveBreakStart >= effectiveBreakEnd) {
                return errorResponse(res, 400, 'Break end time must be after break start time');
            }

            // Check if break is within the current or updated availability period
            if (effectiveBreakStart < effectiveStartTime || effectiveBreakEnd > effectiveEndTime) {
                return errorResponse(res, 400, 'Break must be within availability period');
            }
        }


        // Validate and sanitize other fields
        if (updates.max_appointments_per_slot) {
            updates.max_appointments_per_slot = Math.max(1, parseInt(updates.max_appointments_per_slot));
        }

        if (updates.slot_duration_minutes) {
            updates.slot_duration_minutes = Math.max(15, parseInt(updates.slot_duration_minutes));
        }

        if (updates.availability_type && !['regular', 'temporary', 'special', 'emergency'].includes(updates.availability_type)) {
            return errorResponse(res, 400, 'Invalid availability_type');
        }

        // Date validation logic remains the same (handles partial updates)
        let validFromDate = updates.valid_from ? new Date(updates.valid_from) : null;
        let validToDate = updates.valid_to ? new Date(updates.valid_to) : null;

        if (updates.valid_from) {
            if (isNaN(validFromDate.getTime())) {
                return errorResponse(res, 400, 'Invalid valid_from date');
            }
            updates.valid_from = validFromDate;
        }

        if (updates.valid_to) {
            if (isNaN(validToDate.getTime())) {
                return errorResponse(res, 400, 'Invalid valid_to date');
            }
            updates.valid_to = validToDate;

            // Check combined dates (using new 'valid_from' or existing 'valid_from')
            const finalValidFrom = updates.valid_from || existingSlot.valid_from;
            if (finalValidFrom && updates.valid_to < finalValidFrom) {
                return errorResponse(res, 400, 'valid_to must be after valid_from');
            }
        }

        // The StaffAvailability.update function should enforce staffId ownership via a WHERE clause
        const result = await StaffAvailability.update(slotId, updates, staffId);

        if (!result.success) {
            // Updated error response handling to be more specific, assuming model enforces staffId
            return errorResponse(res, 404, result.error);
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

        // The StaffAvailability.delete function should enforce staffId ownership via a WHERE clause
        const result = await StaffAvailability.delete(slotId, staffId);

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