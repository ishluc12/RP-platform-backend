const Appointment = require('../../models/Appointment');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

module.exports = {
    async list(req, res) {
        try {
            // Filter by appointee_id
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
            // Filter by appointee_id
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
            const apptId = req.params.id;
            const staffId = req.user.id; // Get the ID of the authenticated staff member

            if (!apptId) {
                return errorResponse(res, 400, 'Invalid appointment ID');
            }

            // CRITICAL FIX: Status list must match the database enum exactly.
            // The database schema only allows: 'pending', 'accepted', 'declined', 'completed', 'cancelled', 'rescheduled'.
            if (!['pending', 'accepted', 'declined', 'completed', 'cancelled', 'rescheduled'].includes(status)) {
                return errorResponse(res, 400, 'Invalid status. Status must be one of: pending, accepted, declined, completed, cancelled, rescheduled.');
            }

            // CRITICAL SECURITY FIX: Update function must enforce that the appointment belongs to the logged-in staff member (appointee_id).
            // We assume the model's update function is now implemented as: update(id, data, appointeeIdConstraint)
            const result = await Appointment.update(apptId, { status }, staffId);

            if (!result.success) {
                logger.error(`Failed to update appointment status for ID ${apptId} by staff ${staffId}:`, result.error);
                // Return 404/403 if the model couldn't find/update the record (due to either ID or ownership mismatch)
                return errorResponse(res, 404, result.error);
            }

            response(res, 200, 'Appointment status updated successfully', result.data);
        } catch (err) {
            logger.error('Error updating appointment status:', err.message);
            errorResponse(res, 500, 'Internal server error', err.message);
        }
    },

    async acceptAppointment(req, res) {
        try {
            const { id } = req.params;
            const adminId = req.user.id;
            const { response_message } = req.body;

            // Verify appointment belongs to this admin
            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success || !appointmentResult.data) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.appointee_id !== adminId) {
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

            logger.info(`Administrator ${adminId} accepted appointment ${id}`);
            response(res, 200, 'Appointment accepted successfully', result.data);
        } catch (error) {
            logger.error('Error accepting appointment:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    },

    async declineAppointment(req, res) {
        try {
            const { id } = req.params;
            const adminId = req.user.id;
            const { response_message } = req.body;

            // Verify appointment belongs to this admin
            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success || !appointmentResult.data) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.appointee_id !== adminId) {
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

            logger.info(`Administrator ${adminId} declined appointment ${id}`);
            response(res, 200, 'Appointment declined successfully', result.data);
        } catch (error) {
            logger.error('Error declining appointment:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    },

    async completeAppointment(req, res) {
        try {
            const { id } = req.params;
            const adminId = req.user.id;
            const { notes } = req.body;

            // Verify appointment belongs to this admin
            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success || !appointmentResult.data) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.appointee_id !== adminId) {
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

            logger.info(`Administrator ${adminId} completed appointment ${id}`);
            response(res, 200, 'Appointment completed successfully', result.data);
        } catch (error) {
            logger.error('Error completing appointment:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    },

    async getAppointmentHistory(req, res) {
        try {
            const { id } = req.params;
            const adminId = req.user.id;

            // Verify appointment belongs to this admin
            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success || !appointmentResult.data) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.appointee_id !== adminId) {
                return errorResponse(res, 403, 'Unauthorized to view this appointment history');
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
    },

    async getPending(req, res) {
        try {
            const adminId = req.user.id;
            const result = await Appointment.getPendingForStaff(adminId);
            
            if (!result.success) {
                logger.error('Failed to fetch pending appointments for administrator:', result.error);
                return errorResponse(res, 400, result.error);
            }
            
            response(res, 200, 'Pending appointments fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching pending appointments for administrator:', error.message);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
};