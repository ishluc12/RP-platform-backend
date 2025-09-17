const Appointment = require('../../models/Appointment');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

module.exports = {
    async list(req, res) {
        try {
            const result = await Appointment.listByStaff(req.user.id); // Renamed listByLecturer to listByStaff
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
            const result = await Appointment.findUpcomingAppointments(req.user.id, 'staff', { page: parseInt(page), limit: parseInt(limit) }); // Renamed 'lecturer' role to 'staff'
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

    async updateStatus(req, res) {
        try {
            const { status } = req.body; // 'accepted' | 'declined' | 'completed'
            if (!['accepted', 'declined', 'completed'].includes(status)) {
                return errorResponse(res, 400, 'Invalid status');
            }

            const apptId = parseInt(req.params.id);
            if (isNaN(apptId)) {
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


