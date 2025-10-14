const Appointment = require('../../models/Appointment');
const StaffAvailability = require('../../models/StaffAvailability');
const AvailabilityException = require('../../models/AvailabilityException');
const { response, errorResponse } = require('../../utils/responseHandlers');
const logger = require('../../utils/logger');

class StaffAppointmentController {
    /**
     * Get pending appointments for staff
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getPendingAppointments(req, res) {
        try {
            const staffId = req.user.id;
            const result = await Appointment.getPendingForStaff(staffId);

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Pending appointments fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching pending appointments:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Get all appointments for staff
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getMyAppointments(req, res) {
        try {
            const staffId = req.user.id;
            const { status, appointment_type, priority } = req.query;

            const filters = {};
            if (status) filters.status = status;
            if (appointment_type) filters.appointment_type = appointment_type;
            if (priority) filters.priority = priority;

            const result = await Appointment.getByUser(staffId, 'appointee', filters);

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Appointments fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching staff appointments:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Get upcoming appointments for staff
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getUpcomingAppointments(req, res) {
        try {
            const staffId = req.user.id;
            const result = await Appointment.getUpcoming(staffId, 'appointee');

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Upcoming appointments fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching upcoming appointments:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Accept appointment
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async acceptAppointment(req, res) {
        try {
            const { id } = req.params;
            const { response_message, staff_notes } = req.body;
            const staffId = req.user.id;

            // Check if staff has permission to accept this appointment
            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.appointee_id !== staffId) {
                return errorResponse(res, 403, 'Unauthorized to accept this appointment');
            }

            if (appointmentResult.data.status !== 'pending') {
                return errorResponse(res, 400, 'Appointment is not in pending status');
            }

            const result = await Appointment.updateStatus(id, {
                status: 'accepted',
                response_message,
                staff_notes
            });

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Staff ${staffId} accepted appointment ${id}`);
            response(res, 200, 'Appointment accepted successfully', result.data);
        } catch (error) {
            logger.error('Error accepting appointment:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Decline appointment
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async declineAppointment(req, res) {
        try {
            const { id } = req.params;
            const { response_message, staff_notes } = req.body;
            const staffId = req.user.id;

            // Check if staff has permission to decline this appointment
            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.appointee_id !== staffId) {
                return errorResponse(res, 403, 'Unauthorized to decline this appointment');
            }

            if (appointmentResult.data.status !== 'pending') {
                return errorResponse(res, 400, 'Appointment is not in pending status');
            }

            if (!response_message) {
                return errorResponse(res, 400, 'Response message is required when declining');
            }

            const result = await Appointment.updateStatus(id, {
                status: 'declined',
                response_message,
                staff_notes
            });

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Staff ${staffId} declined appointment ${id}`);
            response(res, 200, 'Appointment declined successfully', result.data);
        } catch (error) {
            logger.error('Error declining appointment:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Reschedule appointment
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async rescheduleAppointment(req, res) {
        try {
            const { id } = req.params;
            const {
                new_appointment_date,
                new_start_time,
                new_end_time,
                response_message,
                staff_notes
            } = req.body;
            const staffId = req.user.id;

            // Validate required fields
            if (!new_appointment_date || !new_start_time || !new_end_time) {
                return errorResponse(res, 400, 'Missing required fields: new_appointment_date, new_start_time, new_end_time');
            }

            // Check if staff has permission to reschedule this appointment
            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.appointee_id !== staffId) {
                return errorResponse(res, 403, 'Unauthorized to reschedule this appointment');
            }

            if (!['pending', 'accepted'].includes(appointmentResult.data.status)) {
                return errorResponse(res, 400, 'Appointment cannot be rescheduled in current status');
            }

            // Check if new slot is available
            const isAvailable = await Appointment.isSlotAvailable(
                staffId,
                new_appointment_date,
                new_start_time,
                new_end_time
            );

            if (!isAvailable) {
                return errorResponse(res, 400, 'New time slot is not available');
            }

            const result = await Appointment.updateStatus(id, {
                status: 'rescheduled',
                new_appointment_date,
                new_start_time,
                new_end_time,
                response_message,
                staff_notes
            });

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Staff ${staffId} rescheduled appointment ${id}`);
            response(res, 200, 'Appointment rescheduled successfully', result.data);
        } catch (error) {
            logger.error('Error rescheduling appointment:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Mark appointment as completed
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async completeAppointment(req, res) {
        try {
            const { id } = req.params;
            const { staff_notes } = req.body;
            const staffId = req.user.id;

            // Check if staff has permission to complete this appointment
            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.appointee_id !== staffId) {
                return errorResponse(res, 403, 'Unauthorized to complete this appointment');
            }

            if (appointmentResult.data.status !== 'accepted') {
                return errorResponse(res, 400, 'Only accepted appointments can be marked as completed');
            }

            const result = await Appointment.updateStatus(id, {
                status: 'completed',
                staff_notes
            });

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Staff ${staffId} completed appointment ${id}`);
            response(res, 200, 'Appointment marked as completed successfully', result.data);
        } catch (error) {
            logger.error('Error completing appointment:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Cancel appointment
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async cancelAppointment(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const staffId = req.user.id;

            if (!reason) {
                return errorResponse(res, 400, 'Cancellation reason is required');
            }

            const result = await Appointment.cancel(id, staffId, reason);

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Staff ${staffId} cancelled appointment ${id}`);
            response(res, 200, 'Appointment cancelled successfully', result.data);
        } catch (error) {
            logger.error('Error cancelling appointment:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Get appointment details
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getAppointmentDetails(req, res) {
        try {
            const { id } = req.params;
            const staffId = req.user.id;

            const result = await Appointment.getById(id);

            if (!result.success) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            // Check if staff has permission to view this appointment
            if (result.data.appointee_id !== staffId) {
                return errorResponse(res, 403, 'Unauthorized to view this appointment');
            }

            response(res, 200, 'Appointment details fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching appointment details:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Get appointment statistics for staff
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getAppointmentStats(req, res) {
        try {
            const staffId = req.user.id;
            const result = await Appointment.getStats(staffId, 'appointee');

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Appointment statistics fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching appointment stats:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Get appointment history
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    static async getAppointmentHistory(req, res) {
        try {
            const { id } = req.params;
            const staffId = req.user.id;

            // First check if staff has permission to view this appointment
            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.appointee_id !== staffId) {
                return errorResponse(res, 403, 'Unauthorized to view this appointment');
            }

            const result = await Appointment.getHistory(id);

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Appointment history fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching appointment history:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }
}

module.exports = StaffAppointmentController;