const { supabase } = require('../../config/database');
const StaffAvailability = require('../../models/StaffAvailability'); // Renamed model
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

// Create or bulk insert availability slots for the authenticated staff member
const createAvailability = async (req, res) => {
    try {
        const staffId = req.user.id; // Renamed lecturerId to staffId
        const { day_of_week, start_time, end_time, max_regular_students, max_emergency_students, allow_emergency, is_active } = req.body; // Expect single slot directly

        if (!day_of_week || !start_time || !end_time) {
            return errorResponse(res, 400, 'day_of_week, start_time, and end_time are required');
        }

        // Validate day_of_week is between 1 and 7
        if (day_of_week < 1 || day_of_week > 7) {
            return errorResponse(res, 400, 'day_of_week must be between 1 and 7 (1=Monday, 7=Sunday)');
        }

        const result = await StaffAvailability.create({
            staff_id: staffId,
            day_of_week,
            start_time,
            end_time,
            max_regular_students: max_regular_students || 0, // Default to 0 if not provided
            max_emergency_students: max_emergency_students || 0, // Default to 0 if not provided
            allow_emergency: allow_emergency !== undefined ? allow_emergency : false, // Default to false
            is_active: is_active !== undefined ? is_active : true, // Default to true
        });

        if (!result.success) throw new Error(result.error);

        response(res, 201, 'Availability slot created successfully', result.data);
    } catch (error) {
        logger.error('Error creating availability:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Get all availability slots for the authenticated staff member
const getMyAvailability = async (req, res) => {
    try {
        const staffId = req.user.id; // Renamed lecturerId to staffId
        const { day_of_week } = req.query; // Accept day_of_week as query parameter

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

        if (!result.success) throw new Error(result.error);

        response(res, 200, 'Staff availability fetched successfully', result.data);
    } catch (error) {
        logger.error('Error fetching availability:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Update a specific availability slot owned by the authenticated staff member
const updateAvailability = async (req, res) => {
    try {
        const staffId = req.user.id; // Renamed lecturerId to staffId
        const slotId = req.params.id;
        const updates = req.body;

        if (!slotId) {
            return errorResponse(res, 400, 'Invalid slot ID');
        }

        const result = await StaffAvailability.update(slotId, updates); // Removed staffId as an argument
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
        const staffId = req.user.id; // Renamed lecturerId to staffId
        const slotId = req.params.id;

        if (!slotId) {
            return errorResponse(res, 400, 'Invalid slot ID');
        }

        const result = await StaffAvailability.delete(slotId); // Removed staffId as an argument
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


