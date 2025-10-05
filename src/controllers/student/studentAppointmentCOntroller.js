const Appointment = require('../../models/Appointment');
const StaffAvailability = require('../../models/StaffAvailability');
const { response, errorResponse } = require('../../utils/responseHandlers');
const logger = require('../../utils/logger');

class StudentAppointmentController {
    static async createAppointment(req, res) {
        try {
            const studentId = req.user.id;
            const payload = req.body;

            // Validate payload
            if (!payload.appointee_id || !payload.appointment_date || !payload.start_time || !payload.end_time || !payload.reason) {
                return errorResponse(res, 400, 'Missing required fields');
            }

            // Check if slot is available
            const isAvailable = await StaffAvailability.isSlotAvailable(payload.appointee_id, payload.appointment_date, payload.start_time, payload.end_time);
            if (!isAvailable) {
                return errorResponse(res, 400, 'Selected slot is not available');
            }

            const result = await Appointment.create({
                requester_id: studentId,
                ...payload,
                status: 'pending'
            });

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            response(res, 201, 'Appointment request created successfully', result.data);
        } catch (error) {
            logger.error('Error creating appointment:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    static async getMyAppointments(req, res) {
        try {
            const studentId = req.user.id;
            const result = await Appointment.getByUser(studentId, 'requester');

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Appointments fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching appointments:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    static async getUpcomingAppointments(req, res) {
        try {
            const studentId = req.user.id;
            const result = await Appointment.getUpcoming(studentId, 'requester');

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Upcoming appointments fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching upcoming appointments:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    static async getAppointmentDetails(req, res) {
        try {
            const { id } = req.params;
            const studentId = req.user.id;

            const result = await Appointment.getById(id);

            if (!result.success) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (result.data.requester_id !== studentId) {
                return errorResponse(res, 403, 'Unauthorized to view this appointment');
            }

            response(res, 200, 'Appointment details fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching appointment details:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    static async cancelAppointment(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;
            const studentId = req.user.id;

            if (!reason) {
                return errorResponse(res, 400, 'Cancellation reason is required');
            }

            const result = await Appointment.cancel(id, studentId, reason, 'requester');

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            response(res, 200, 'Appointment cancelled successfully', result.data);
        } catch (error) {
            logger.error('Error cancelling appointment:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    static async getAppointmentStats(req, res) {
        try {
            const studentId = req.user.id;
            const result = await Appointment.getStats(studentId, 'requester');

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Appointment statistics fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching appointment stats:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    static async getAppointmentHistory(req, res) {
        try {
            const { id } = req.params;
            const studentId = req.user.id;

            const appointmentResult = await Appointment.getById(id);
            if (!appointmentResult.success) {
                return errorResponse(res, 404, 'Appointment not found');
            }

            if (appointmentResult.data.requester_id !== studentId) {
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

    static async getAvailableLecturers(req, res) {
        try {
            const { date, start_time, end_time } = req.query;

            if (!date || !start_time || !end_time) {
                return errorResponse(res, 400, 'Missing required parameters: date, start_time, end_time');
            }

            const result = await StaffAvailability.getAvailableStaff(date, start_time, end_time);

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Available lecturers fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching available lecturers:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    static async getAvailableSlotsForLecturer(req, res) {
        try {
            const staffId = req.params.staffId;
            const { date } = req.query;

            if (!staffId || !date) {
                return errorResponse(res, 400, 'Missing required parameters: staffId, date');
            }

            const result = await StaffAvailability.getAvailableSlots(staffId, date);

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Available slots fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching available slots:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    static async getAllLecturers(req, res) {
        try {
            const result = await StaffAvailability.getAllLecturers();

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'All lecturers fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching all lecturers:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }
}

module.exports = StudentAppointmentController;