const Appointment = require('../../models/Appointment');
const StaffAvailability = require('../../models/StaffAvailability');
const { response, errorResponse } = require('../../utils/responseHandlers');
const logger = require('../../utils/logger');

class StudentAppointmentController {
    static async createAppointment(req, res) {
        try {
            const studentId = req.user.id;
            const payload = req.body || {};

            // Support both new (date + times) and legacy (single datetime) payloads
            let { appointee_id, appointment_date, start_time, end_time, duration_minutes, reason, appointment_type, priority, meeting_type, location, meeting_link, student_notes, notes } = payload;

            // If only appointment_time provided, derive date and default 30-min end_time
            if ((!appointment_date || !start_time) && payload.appointment_time) {
                const dt = new Date(payload.appointment_time);
                if (!isNaN(dt.getTime())) {
                    appointment_date = dt.toISOString().slice(0, 10);
                    const hh = String(dt.getHours()).padStart(2, '0');
                    const mm = String(dt.getMinutes()).padStart(2, '0');
                    start_time = `${hh}:${mm}:00`;
                    const dur = Number(duration_minutes) || 30;
                    const endDt = new Date(dt.getTime() + dur * 60000);
                    const eh = String(endDt.getHours()).padStart(2, '0');
                    const em = String(endDt.getMinutes()).padStart(2, '0');
                    end_time = `${eh}:${em}:00`;
                }
            }

            // Validate required fields now
            if (!appointee_id || !appointment_date || !start_time || !end_time || !reason) {
                return errorResponse(res, 400, 'Missing required fields: appointee_id, appointment_date, start_time, end_time, reason');
            }

            // Emergency support: if flagged, set priority/type
            const isEmergency = payload.is_emergency === true || payload.emergency === true || payload.availability_type === 'emergency';
            if (isEmergency) {
                priority = priority || 'urgent';
                appointment_type = appointment_type || 'emergency';
            }

            // Check if slot is available
            const isAvailable = await Appointment.isSlotAvailable(appointee_id, appointment_date, start_time, end_time);
            if (!isAvailable) {
                return errorResponse(res, 400, 'Selected slot is not available');
            }

            const result = await Appointment.create({
                requester_id: studentId,
                appointee_id,
                appointment_date,
                start_time,
                end_time,
                duration_minutes: Number(duration_minutes) || 30,
                reason,
                appointment_type,
                priority: priority || 'normal',
                meeting_type: meeting_type || 'in_person',
                location,
                meeting_link,
                student_notes: student_notes || notes,
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
            const result = await Appointment.getUpcomingByUser(studentId, 'requester');

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Upcoming appointments fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching upcoming appointments:', error);
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
            logger.error('Error fetching appointment statistics:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    static async getAvailableLecturers(req, res) {
        try {
            const { date, start_time, end_time, role, emergency, availability_type } = req.query;

            if (!date || !start_time || !end_time) {
                return errorResponse(res, 400, 'Missing required parameters: date, start_time, end_time');
            }

            const availabilityType = availability_type || (String(emergency).toLowerCase() === 'true' ? 'emergency' : null);
            const result = await StaffAvailability.getAvailableStaff(date, start_time, end_time, role || null, availabilityType);

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
            const { date, emergency, availability_type } = req.query;

            if (!staffId || !date) {
                return errorResponse(res, 400, 'Missing required parameters: staffId, date');
            }

            const availabilityType = availability_type || (String(emergency).toLowerCase() === 'true' ? 'emergency' : null);

            // If an availability type is specified, compute slots from matching availability rows
            if (availabilityType) {
                const dayOfWeek = new Date(date).getDay(); // 0..6
                const availRes = await StaffAvailability.getByStaff(staffId, { is_active: true, day_of_week: dayOfWeek, availability_type: availabilityType });
                if (!availRes.success) {
                    return errorResponse(res, 500, availRes.error);
                }
                const slots = [];
                for (const slot of availRes.data) {
                    const [sh, sm] = String(slot.start_time).split(':').map(Number);
                    const [eh, em] = String(slot.end_time).split(':').map(Number);
                    const startMins = sh * 60 + sm;
                    const endMins = eh * 60 + em;
                    const dur = Number(slot.slot_duration_minutes) || 30;
                    for (let t = startMins; t + dur <= endMins; t += dur) {
                        const sH = String(Math.floor(t / 60)).padStart(2, '0');
                        const sM = String(t % 60).padStart(2, '0');
                        const eTotal = t + dur;
                        const eH = String(Math.floor(eTotal / 60)).padStart(2, '0');
                        const eM = String(eTotal % 60).padStart(2, '0');
                        const sTime = `${sH}:${sM}:00`;
                        const eTime = `${eH}:${eM}:00`;
                        const available = await Appointment.isSlotAvailable(staffId, date, sTime, eTime);
                        if (available) {
                            slots.push({ start_time: `${sH}:${sM}`, end_time: `${eH}:${eM}`, slot_duration: dur });
                        }
                    }
                }
                return response(res, 200, 'Available slots fetched successfully', slots);
            }

            // Fallback to DB function for general case
            const result = await Appointment.getAvailableSlots(staffId, date);

            if (!result.success) {
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Available slots fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching available slots:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }
}

module.exports = StudentAppointmentController;