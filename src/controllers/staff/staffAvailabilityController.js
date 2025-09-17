const { supabase } = require('../../config/database');
const StaffAvailability = require('../../models/StaffAvailability'); // Renamed model
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

// Create or bulk insert availability slots for the authenticated staff member
const createAvailability = async (req, res) => {
    try {
        const staffId = req.user.id; // Renamed lecturerId to staffId
        const { slots } = req.body; // [{ available_from, available_to, recurring }]

        if (!Array.isArray(slots) || slots.length === 0) {
            return errorResponse(res, 400, 'Slots array is required');
        }

        const createdSlots = [];
        for (const slot of slots) {
            if (!slot.available_from || !slot.available_to) {
                return errorResponse(res, 400, 'Each slot must include available_from and available_to');
            }
            const result = await StaffAvailability.create({ ...slot, staff_id: staffId }); // Renamed lecturer_id to staff_id
            if (!result.success) throw new Error(result.error);
            createdSlots.push(result.data);
        }

        response(res, 201, 'Availability slots created successfully', createdSlots);
    } catch (error) {
        logger.error('Error creating availability:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Get all availability slots for the authenticated staff member
const getMyAvailability = async (req, res) => {
    try {
        const staffId = req.user.id; // Renamed lecturerId to staffId
        const { start_date, end_date } = req.query;

        const result = await StaffAvailability.getByStaff(staffId, { start_date, end_date }); // Renamed getByLecturer to getByStaff
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
        const slotId = Number(req.params.id);
        const updates = req.body;

        if (Number.isNaN(slotId)) {
            return errorResponse(res, 400, 'Invalid slot ID');
        }

        const result = await StaffAvailability.update(slotId, staffId, updates); // Renamed lecturerId to staffId
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
        const slotId = Number(req.params.id);

        if (Number.isNaN(slotId)) {
            return errorResponse(res, 400, 'Invalid slot ID');
        }

        const result = await StaffAvailability.delete(slotId, staffId); // Renamed lecturerId to staffId
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


