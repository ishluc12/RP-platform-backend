const { supabase } = require('../../config/database');
const StaffAvailability = require('../../models/StaffAvailability');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

// Create availability slot for the authenticated administrator
const createAvailability = async (req, res) => {
    try {
        const staffId = req.user.id;
        const { day_of_week, week_of_month, weeks, start_time, end_time, max_regular_students, max_emergency_students, allow_emergency, is_active } = req.body;

        // Validation
        if (!day_of_week || !start_time || !end_time) {
            return errorResponse(res, 400, 'day_of_week, start_time, and end_time are required');
        }

        // Validate day_of_week is between 1 and 7
        const dayOfWeekNum = parseInt(day_of_week);
        if (isNaN(dayOfWeekNum) || dayOfWeekNum < 1 || dayOfWeekNum > 7) {
            return errorResponse(res, 400, 'day_of_week must be between 1 and 7 (1=Monday, 7=Sunday)');
        }

        // Validate week_of_month if provided
        let weekOfMonth = null;
        if (week_of_month !== undefined) {
            const weekNum = parseInt(week_of_month);
            if (isNaN(weekNum) || weekNum < 1 || weekNum > 5) {
                return errorResponse(res, 400, 'week_of_month must be between 1 and 5');
            }
            weekOfMonth = weekNum;
        }

        // Handle weeks array for bulk creation
        let weeksToCreate = [];
        if (weeks && Array.isArray(weeks)) {
            weeksToCreate = weeks.filter(w => {
                const num = parseInt(w);
                return !isNaN(num) && num >= 1 && num <= 5;
            });
            if (weeksToCreate.length === 0) {
                return errorResponse(res, 400, 'weeks array must contain valid week numbers (1-5)');
            }
        } else if (weekOfMonth) {
            weeksToCreate = [weekOfMonth];
        } else {
            // If no weeks specified, create for all weeks (backward compatibility)
            weeksToCreate = [null];
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

        // Validate times
        if (!formattedStartTime || !formattedEndTime) {
            return errorResponse(res, 400, 'Invalid time format. Use HH:MM or HH:MM:SS');
        }

        if (formattedStartTime >= formattedEndTime) {
            return errorResponse(res, 400, 'End time must be after start time');
        }

        // Validate and sanitize student limits
        const maxRegular = Math.max(0, Math.min(parseInt(max_regular_students) || 0, 10));
        const maxEmergency = Math.max(0, Math.min(parseInt(max_emergency_students) || 0, 5));

        // Create slots for each week
        const createdSlots = [];
        for (const week of weeksToCreate) {
            const result = await StaffAvailability.create({
                staff_id: staffId,
                day_of_week: dayOfWeekNum,
                week_of_month: week,
                start_time: formattedStartTime,
                end_time: formattedEndTime,
                max_regular_students: maxRegular,
                max_emergency_students: maxEmergency,
                allow_emergency: allow_emergency !== undefined ? Boolean(allow_emergency) : false,
                is_active: is_active !== undefined ? Boolean(is_active) : true,
            });

            if (!result.success) {
                logger.error('Failed to create availability in DB:', result.error);
                return errorResponse(res, 400, result.error);
            }
            createdSlots.push(result.data);
        }

        logger.info(`Availability slots created for administrator: ${staffId}, day: ${dayOfWeekNum}, weeks: ${weeksToCreate.join(', ')}`);
        response(res, 201, 'Availability slots created successfully', createdSlots);
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
