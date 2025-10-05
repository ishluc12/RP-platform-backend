const Appointment = require('../../models/Appointment');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

module.exports = {
    async list(req, res) {
        try {
            const result = await Appointment.getByUser(req.user.id, 'appointee'); // Use existing getByUser method
            if (!result.success) {
                logger.error('Failed to fetch staff appointments:', result.error);
                return errorResponse(res, 400, result.error);
            }
            response(res, 200, 'Staff appointments fetched successfully', result.data);
        } catch (err) {
            logger.error('Error fetching staff appointments:', err.message);
            errorResponse(res, 500, 'Internal server error', err.message);
        }
    },

    async getUpcoming(req, res) {
        try {
            const { page, limit } = req.query;
            const result = await Appointment.getUpcoming(req.user.id, 'appointee'); // Use existing getUpcoming method
            if (!result.success) {
                logger.error('Failed to fetch upcoming staff appointments:', result.error);
                return errorResponse(res, 400, result.error);
            }
            response(res, 200, 'Upcoming staff appointments fetched successfully', result.data);
        } catch (err) {
            logger.error('Error fetching upcoming staff appointments:', err.message);
            errorResponse(res, 500, 'Internal server error', err.message);
        }
    },

    async getPending(req, res) {
        try {
            const result = await Appointment.getPendingForStaff(req.user.id);
            if (!result.success) {
                logger.error('Failed to fetch pending appointments:', result.error);
                return errorResponse(res, 400, result.error);
            }
            response(res, 200, 'Pending appointments fetched successfully', result.data);
        } catch (err) {
            logger.error('Error fetching pending appointments:', err.message);
            errorResponse(res, 500, 'Internal server error', err.message);
        }
    },

    async updateStatus(req, res) {
        try {
            const { status } = req.body;

            // Validate status against the allowed enum values
            if (status && !['pending', 'accepted', 'declined', 'completed', 'cancelled', 'rescheduled'].includes(status)) {
                return errorResponse(res, 400, 'Invalid status value.');
            }

            const apptId = req.params.id;
            if (!apptId) {
                return errorResponse(res, 400, 'Invalid appointment ID');
            }

            // Pass the entire request body to the model's updateStatus function
            const result = await Appointment.updateStatus(apptId, req.body);

            if (!result.success) {
                logger.error('Failed to update appointment status:', result.error);
                return errorResponse(res, 400, result.error);
            }

            response(res, 200, 'Appointment status updated successfully', result.data);
        } catch (err) {
            logger.error('Error updating appointment status:', err.message);
            errorResponse(res, 500, 'Internal server error', err.message);
        }
    }
};


