const Appointment = require('../../models/Appointment');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

module.exports = {
    async create(req, res) {
        try {
            const student_id = req.user.id;
            const { lecturer_id, appointment_time, reason, location, meeting_type, meeting_link } = req.body;

            if (!lecturer_id || !appointment_time || !reason) {
                return errorResponse(res, 400, 'Lecturer ID, appointment time, and reason are required');
            }

            const parsedTime = new Date(appointment_time);
            if (isNaN(parsedTime.getTime())) {
                return errorResponse(res, 400, 'Invalid appointment time');
            }

            const result = await Appointment.create({
                student_id,
                lecturer_id,
                appointment_time: parsedTime.toISOString(),
                reason,
                location,
                meeting_type,
                meeting_link
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
            const result = await Appointment.listByStudent(req.user.id);
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
            const result = await Appointment.findUpcomingAppointments(req.user.id, 'student', { page: parseInt(page), limit: parseInt(limit) });
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
            const appointmentId = parseInt(req.params.id);
            if (isNaN(appointmentId)) {
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

