const Appointment = require('../../models/Appointment');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class LecturerAppointmentController {
    /**
     * Get all appointments in 'pending' status for the logged-in lecturer.
     * Only lecturers can access.
     */
    static async getPending(req, res) {
        try {
            // Only allow lecturer role
            if (req.user.role !== 'lecturer') {
                return errorResponse(res, 403, 'Forbidden: Only lecturers can access pending appointments');
            }
            const lecturerId = req.user.id;
            const result = await Appointment.getByAppointeeAndStatus(lecturerId, 'pending');
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

    /**
     * List all appointments for the lecturer with optional filters.
     * Only lecturers can access.
     */
    static async list(req, res) {
        try {
            if (req.user.role !== 'lecturer') {
                return errorResponse(res, 403, 'Forbidden: Only lecturers can access their appointments');
            }
            const lecturerId = req.user.id;
            const { status, appointment_type, priority } = req.query;
            const filters = {};
            if (status) filters.status = status;
            if (appointment_type) filters.appointment_type = appointment_type;
            if (priority) filters.priority = priority;

            const result = await Appointment.getByAppointee(lecturerId, filters);
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

    /**
     * Get upcoming appointments (accepted/rescheduled/pending) for the lecturer.
     * Only lecturers can access.
     */
    static async getUpcoming(req, res) {
        try {
            if (req.user.role !== 'lecturer') {
                return errorResponse(res, 403, 'Forbidden: Only lecturers can access upcoming appointments');
            }
            const lecturerId = req.user.id;
            const result = await Appointment.getUpcomingForLecturer(lecturerId);
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

    /**
     * Update the status of an appointment (Accept, Decline, Reschedule, Complete, Cancel).
     * Only lecturers can perform status updates on their appointments.
     */
    static async updateStatus(req, res) {
        try {
            if (req.user.role !== 'lecturer') {
                return errorResponse(res, 403, 'Forbidden: Only lecturers can update appointment status');
            }
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
            if (!appointmentResult.success || !appointmentResult.data) {
                return errorResponse(res, 404, 'Appointment not found');
            }
            const appointment = appointmentResult.data;

            // Only appointee (lecturer) can update their appointments
            if (appointment.appointee_id !== lecturerId) {
                return errorResponse(res, 403, 'Unauthorized to modify this appointment');
            }

            const currentStatus = appointment.status;
            const updateData = { status, response_message, staff_notes };

            switch (status) {
                case 'accepted':
                case 'declined':
                    if (currentStatus !== 'pending') {
                        return errorResponse(res, 400, `Only pending appointments can be ${status}.`);
                    }
                    if (status === 'declined' && !response_message) {
                        return errorResponse(res, 400, 'Response message is required when declining.');
                    }
                    break;
                case 'completed':
                    if (currentStatus !== 'accepted' && currentStatus !== 'rescheduled') {
                        return errorResponse(res, 400, 'Only accepted or rescheduled appointments can be marked as completed.');
                    }
                    break;
                case 'rescheduled':
                    if (!new_appointment_date || !new_start_time || !new_end_time) {
                        return errorResponse(res, 400, 'New date and times required for rescheduling.');
                    }
                    // Assume isSlotAvailable checks for slot conflicts
                    const isAvailable = await Appointment.isSlotAvailable(
                        lecturerId, new_appointment_date, new_start_time, new_end_time, id
                    );
                    if (!isAvailable) {
                        return errorResponse(res, 400, 'New time slot is not available for this lecturer.');
                    }
                    updateData.appointment_date = new_appointment_date;
                    updateData.start_time = new_start_time;
                    updateData.end_time = new_end_time;
                    break;
                case 'cancelled':
                    if (currentStatus === 'completed' || currentStatus === 'declined') {
                        return errorResponse(res, 400, 'Cannot cancel an already completed or declined appointment.');
                    }
                    break;
                default:
                    return errorResponse(res, 400, 'Invalid status transition.');
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

    /**
     * Accept an appointment (convenience method that calls updateStatus)
     */
    static async acceptAppointment(req, res) {
        try {
            if (req.user.role !== 'lecturer') {
                return errorResponse(res, 403, 'Forbidden: Only lecturers can accept appointments');
            }
            const { id } = req.params;
            const lecturerId = req.user.id;
            const { response_message } = req.body;

            // Verify appointment belongs to this lecturer
            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success || !appointmentResult.data) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.appointee_id !== lecturerId) {
                return errorResponse(res, 403, 'Unauthorized to accept this appointment');
            }

            const result = await Appointment.updateStatus(id, {
                status: 'accepted',
                response_message: response_message || 'Appointment accepted',
                responded_at: new Date().toISOString()
            });

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Lecturer ${lecturerId} accepted appointment ${id}`);
            response(res, 200, 'Appointment accepted successfully', result.data);
        } catch (error) {
            logger.error('Error accepting appointment:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Decline an appointment (convenience method that calls updateStatus)
     */
    static async declineAppointment(req, res) {
        try {
            if (req.user.role !== 'lecturer') {
                return errorResponse(res, 403, 'Forbidden: Only lecturers can decline appointments');
            }
            const { id } = req.params;
            const lecturerId = req.user.id;
            const { response_message } = req.body;

            // Verify appointment belongs to this lecturer
            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success || !appointmentResult.data) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.appointee_id !== lecturerId) {
                return errorResponse(res, 403, 'Unauthorized to decline this appointment');
            }

            const result = await Appointment.updateStatus(id, {
                status: 'declined',
                response_message: response_message || 'Appointment declined',
                responded_at: new Date().toISOString()
            });

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Lecturer ${lecturerId} declined appointment ${id}`);
            response(res, 200, 'Appointment declined successfully', result.data);
        } catch (error) {
            logger.error('Error declining appointment:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Complete an appointment (convenience method that calls updateStatus)
     */
    static async completeAppointment(req, res) {
        try {
            if (req.user.role !== 'lecturer') {
                return errorResponse(res, 403, 'Forbidden: Only lecturers can complete appointments');
            }
            const { id } = req.params;
            const lecturerId = req.user.id;
            const { notes } = req.body;

            // Verify appointment belongs to this lecturer
            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success || !appointmentResult.data) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.appointee_id !== lecturerId) {
                return errorResponse(res, 403, 'Unauthorized to complete this appointment');
            }

            const result = await Appointment.updateStatus(id, {
                status: 'completed',
                staff_notes: notes,
                completed_at: new Date().toISOString()
            });

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Lecturer ${lecturerId} completed appointment ${id}`);
            response(res, 200, 'Appointment completed successfully', result.data);
        } catch (error) {
            logger.error('Error completing appointment:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Cancel an appointment (convenience method that calls updateStatus)
     */
    static async cancelAppointment(req, res) {
        try {
            if (req.user.role !== 'lecturer') {
                return errorResponse(res, 403, 'Forbidden: Only lecturers can cancel appointments');
            }
            const { id } = req.params;
            const lecturerId = req.user.id;
            const { response_message } = req.body;

            // Verify appointment belongs to this lecturer
            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success || !appointmentResult.data) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.appointee_id !== lecturerId) {
                return errorResponse(res, 403, 'Unauthorized to cancel this appointment');
            }

            const result = await Appointment.updateStatus(id, {
                status: 'cancelled',
                response_message: response_message || 'Appointment cancelled by lecturer',
                cancelled_at: new Date().toISOString()
            });

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Lecturer ${lecturerId} cancelled appointment ${id}`);
            response(res, 200, 'Appointment cancelled successfully', result.data);
        } catch (error) {
            logger.error('Error cancelling appointment:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }
}

module.exports = LecturerAppointmentController;