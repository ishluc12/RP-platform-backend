const { supabase } = require('../../config/database');
const LecturerAvailability = require('../../models/LecturerAvailability');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

// Create or bulk insert availability slots for the authenticated lecturer
const createAvailability = async (req, res) => {
    try {
        const lecturerId = req.user.id;
        const { slots } = req.body; // [{ available_from, available_to, recurring }]

        if (!Array.isArray(slots) || slots.length === 0) {
            return errorResponse(res, 400, 'Slots array is required');
        }

        const createdSlots = [];
        for (const slot of slots) {
            if (!slot.available_from || !slot.available_to) {
                return errorResponse(res, 400, 'Each slot must include available_from and available_to');
            }
            const result = await LecturerAvailability.create({ ...slot, lecturer_id: lecturerId });
            if (!result.success) throw new Error(result.error);
            createdSlots.push(result.data);
        }

        response(res, 201, 'Availability slots created successfully', createdSlots);
    } catch (error) {
        logger.error('Error creating availability:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Get all availability slots for the authenticated lecturer
const getMyAvailability = async (req, res) => {
    try {
        const lecturerId = req.user.id;
        const { start_date, end_date } = req.query;

        const result = await LecturerAvailability.getByLecturer(lecturerId, { start_date, end_date });
        if (!result.success) throw new Error(result.error);

        response(res, 200, 'Lecturer availability fetched successfully', result.data);
    } catch (error) {
        logger.error('Error fetching availability:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Update a specific availability slot owned by the authenticated lecturer
const updateAvailability = async (req, res) => {
    try {
        const lecturerId = req.user.id;
        const slotId = Number(req.params.id);
        const updates = req.body;

        if (Number.isNaN(slotId)) {
            return errorResponse(res, 400, 'Invalid slot ID');
        }

        const result = await LecturerAvailability.update(slotId, lecturerId, updates);
        if (!result.success) {
            return errorResponse(res, result.error.includes('not found') ? 404 : 403, result.error);
        }

        response(res, 200, 'Availability slot updated successfully', result.data);
    } catch (error) {
        logger.error('Error updating availability:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

// Delete a specific availability slot owned by the authenticated lecturer
const deleteAvailability = async (req, res) => {
    try {
        const lecturerId = req.user.id;
        const slotId = Number(req.params.id);

        if (Number.isNaN(slotId)) {
            return errorResponse(res, 400, 'Invalid slot ID');
        }

        const result = await LecturerAvailability.delete(slotId, lecturerId);
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


