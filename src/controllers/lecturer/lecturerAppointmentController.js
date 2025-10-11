const Appointment = require('../../models/Appointment');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class LecturerAppointmentController {
    static async getPending(req, res) {
        try {
            const lecturerId = req.user.id;
            const result = await Appointment.getPendingForStaff(lecturerId);

            if (!result.success) {
                logger.error('Failed to fetch pending appointments:', result.error);
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Pending appointments fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching pending appointments:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    static async list(req, res) {
        try {
            const lecturerId = req.user.id;
            const { status, appointment_type, priority } = req.query;

            const filters = {};
            if (status) filters.status = status;
            if (appointment_type) filters.appointment_type = appointment_type;
            if (priority) filters.priority = priority;

            const result = await Appointment.getByUser(lecturerId, 'appointee', filters);

            if (!result.success) {
                logger.error('Failed to fetch appointments:', result.error);
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Appointments fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching appointments:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    static async getUpcoming(req, res) {
        try {
            const lecturerId = req.user.id;
            const result = await Appointment.getUpcoming(lecturerId, 'appointee');

            if (!result.success) {
                logger.error('Failed to fetch upcoming appointments:', result.error);
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Upcoming appointments fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching upcoming appointments:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    static async updateStatus(req, res) {
        try {
            const { id } = req.params;
            const lecturerId = req.user.id;
            const {
                status,
                response_message,
                staff_notes,
                new_appointment_date,
                new_start_time,
                new_end_time
            } = req.body;

            const validStatuses = ['accepted', 'declined', 'completed', 'cancelled', 'rescheduled'];
            if (!validStatuses.includes(status)) {
                return errorResponse(res, 400, `Invalid status. Must be one of: ${validStatuses.join(', ')}`);
            }

            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.appointee_id !== lecturerId) {
                return errorResponse(res, 403, 'Unauthorized to modify this appointment');
            }

            const currentStatus = appointmentResult.data.status;

            if (status === 'accepted' && currentStatus !== 'pending') {
                return errorResponse(res, 400, 'Only pending appointments can be accepted');
            }

            if (status === 'declined' && currentStatus !== 'pending') {
                return errorResponse(res, 400, 'Only pending appointments can be declined');
            }

            if (status === 'declined' && !response_message) {
                return errorResponse(res, 400, 'Response message is required when declining');
            }

            if (status === 'completed' && currentStatus !== 'accepted') {
                return errorResponse(res, 400, 'Only accepted appointments can be marked as completed');
            }

            if (status === 'rescheduled') {
                if (!new_appointment_date || !new_start_time || !new_end_time) {
                    return errorResponse(res, 400, 'New date and times required for rescheduling');
                }

                const isAvailable = await Appointment.isSlotAvailable(
                    lecturerId,
                    new_appointment_date,
                    new_start_time,
                    new_end_time,
                    id
                );

                if (!isAvailable) {
                    return errorResponse(res, 400, 'New time slot is not available');
                }
            }

            const updateData = {
                status,
                response_message,
                staff_notes
            };

            if (status === 'rescheduled') {
                updateData.appointment_date = new_appointment_date;
                updateData.start_time = new_start_time;
                updateData.end_time = new_end_time;
            }

            const result = await Appointment.updateStatus(id, updateData);

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Lecturer ${lecturerId} updated appointment ${id} to ${status}`);
            response(res, 200, `Appointment ${status} successfully`, result.data);
        } catch (error) {
            logger.error('Error updating appointment status:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}
module.exports = LecturerAppointmentController;