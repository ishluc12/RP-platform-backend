const Appointment = require('../../models/Appointment');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

module.exports = {
    async create(req, res) {
        try {
            const requester_id = req.user.id; // Student ID is now requester_id
            const { appointee_id, appointment_time, reason, location, meeting_type, meeting_link, duration_minutes, priority, appointment_type: type, notes } = req.body; // lecturer_id is now appointee_id, added new fields

            if (!appointee_id || !appointment_time || !reason) {
                return errorResponse(res, 400, 'Appointee ID, appointment time, and reason are required');
            }

            const parsedTime = new Date(appointment_time);
            if (isNaN(parsedTime.getTime())) {
                return errorResponse(res, 400, 'Invalid appointment time');
            }

            const result = await Appointment.create({
                requester_id,
                appointee_id,
                appointment_time: parsedTime.toISOString(),
                reason,
                location,
                meeting_type,
                meeting_link,
                duration_minutes,
                priority,
                appointment_type: type,
                notes
            });

            if (!result.success) {
                logger.error('Failed to create appointment:', result.error);
                return errorResponse(res, 400, result.error);
            }

            response(res, 201, 'Appointment created successfully', result.data);
        } catch (error) {
            logger.error('Error creating appointment:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    },

    async list(req, res) {
        try {
            const result = await Appointment.listByRequester(req.user.id); // Changed to listByRequester
            if (!result.success) {
                logger.error('Failed to fetch student appointments:', result.error);
                return errorResponse(res, 400, result.error);
            }
            response(res, 200, 'Student appointments fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching student appointments:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    },

    async getUpcoming(req, res) {
        try {
            const { page, limit } = req.query;
            const result = await Appointment.findUpcomingAppointments(req.user.id, 'requester', { page: parseInt(page), limit: parseInt(limit) }); // Changed role to 'requester'
            if (!result.success) {
                logger.error('Failed to fetch upcoming student appointments:', result.error);
                return errorResponse(res, 400, result.error);
            }
            response(res, 200, 'Upcoming student appointments fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching upcoming student appointments:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    },

    async cancel(req, res) {
        try {
            const appointmentId = req.params.id; // Removed parseInt
            if (!appointmentId) {
                return errorResponse(res, 400, 'Invalid appointment ID');
            }

            const result = await Appointment.cancel(appointmentId, req.user.id);
            if (!result.success) {
                logger.error('Failed to cancel appointment:', result.error);
                return errorResponse(res, 400, result.error);
            }

            response(res, 200, 'Appointment cancelled successfully', result.data);
        } catch (error) {
            logger.error('Error canceling appointment:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
};

