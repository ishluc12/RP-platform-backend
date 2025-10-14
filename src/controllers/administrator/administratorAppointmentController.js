const Appointment = require('../../models/Appointment');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

module.exports = {
    async list(req, res) {
        try {
            const result = await Appointment.listByAppointee(req.user.id);
            if (!result.success) {
                logger.error('Failed to fetch administrator appointments:', result.error);
                return errorResponse(res, 400, result.error);
            }
            response(res, 200, 'Administrator appointments fetched successfully', result.data);
        } catch (err) {
            logger.error('Error fetching administrator appointments:', err.message);
            errorResponse(res, 500, 'Internal server error', err.message);
        }
    },

    async getUpcoming(req, res) {
        try {
            const { page, limit } = req.query;
            const result = await Appointment.findUpcomingAppointments(req.user.id, 'appointee', { page: parseInt(page), limit: parseInt(limit) });
            if (!result.success) {
                logger.error('Failed to fetch upcoming administrator appointments:', result.error);
                return errorResponse(res, 400, result.error);
            }
            response(res, 200, 'Upcoming administrator appointments fetched successfully', result.data);
        } catch (err) {
            logger.error('Error fetching upcoming administrator appointments:', err.message);
            errorResponse(res, 500, 'Internal server error', err.message);
        }
    },

    async updateStatus(req, res) {
        try {
            const { status } = req.body;
            // Updated to match database enum values (normalization handled by database trigger)
            if (!['pending', 'accepted', 'declined', 'completed', 'cancelled', 'rescheduled', 'approved', 'rejected'].includes(status)) {
                return errorResponse(res, 400, 'Invalid status');
            }

            const apptId = req.params.id;
            if (!apptId) {
                return errorResponse(res, 400, 'Invalid appointment ID');
            }

            const result = await Appointment.update(apptId, { status });
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
