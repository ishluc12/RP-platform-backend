const StaffAvailability = require('../../models/StaffAvailability');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class LecturerAvailabilityController {
    // Create a new availability slot
    static async createAvailability(req, res) {
        try {
            if (req.user.role !== 'lecturer') {
                return errorResponse(res, 403, 'Forbidden: Only lecturers can create availability slots');
            }
            const staff_id = req.user.id;
            const {
                specific_date,
                day_of_week,
                start_time,
                end_time,
                break_start_time,
                break_end_time,
                slot_duration_minutes,
                max_appointments_per_slot,
                buffer_time_minutes,
                availability_type,
                valid_from,
                valid_to,
                is_active = true
            } = req.body;

            // Validation - require either specific_date OR day_of_week
            if (!start_time || !end_time) {
                return errorResponse(res, 400, 'Missing required fields: start_time, end_time');
            }

            let calculatedDayOfWeek = day_of_week;

            // If specific_date is provided, validate it
            if (specific_date) {
                const selectedDate = new Date(specific_date);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                if (selectedDate < today) {
                    return errorResponse(res, 400, 'Cannot create availability for past dates');
                }

                calculatedDayOfWeek = selectedDate.getDay();
                if (calculatedDayOfWeek === 0 || calculatedDayOfWeek === 6) {
                    return errorResponse(res, 400, 'Cannot create availability for weekends (Saturday/Sunday)');
                }
            } else if (day_of_week !== undefined) {
                // Validate day_of_week for recurring slots
                if (day_of_week < 1 || day_of_week > 5) {
                    return errorResponse(res, 400, 'day_of_week must be between 1 (Monday) and 5 (Friday). Weekends are not allowed.');
                }
            } else {
                return errorResponse(res, 400, 'Either specific_date or day_of_week is required');
            }

            const data = {
                staff_id,
                specific_date: specific_date || null,
                day_of_week: calculatedDayOfWeek,
                start_time,
                end_time,
                break_start_time,
                break_end_time,
                slot_duration_minutes,
                max_appointments_per_slot,
                buffer_time_minutes,
                availability_type,
                valid_from: specific_date || valid_from,
                valid_to: specific_date || valid_to,
                is_active
            };

            const result = await StaffAvailability.create(data);
            if (!result.success) {
                logger.error('Failed to create availability:', result.error);
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Lecturer ${staff_id} created availability slot`);
            response(res, 201, 'Availability slot created successfully', result.data);
        } catch (error) {
            logger.error('Error creating lecturer availability:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    // List all availability slots for the authenticated lecturer
    static async listMyAvailability(req, res) {
        try {
            if (req.user.role !== 'lecturer') {
                return errorResponse(res, 403, 'Forbidden: Only lecturers can view their availability slots');
            }
            
            // Auto-cleanup: Delete past slots before fetching
            await StaffAvailability.deletePastSlots();
            
            const staff_id = req.user.id;
            const { day_of_week, is_active, availability_type } = req.query;
            const filters = {};
            if (day_of_week !== undefined) filters.day_of_week = parseInt(day_of_week);
            if (is_active !== undefined) filters.is_active = is_active === 'true';
            if (availability_type) filters.availability_type = availability_type;

            const result = await StaffAvailability.getByStaff(staff_id, filters);
            if (!result.success) {
                logger.error('Failed to fetch availability:', result.error);
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Availability fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching lecturer availability:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    // Update a specific availability slot owned by the lecturer
    static async updateAvailability(req, res) {
        try {
            if (req.user.role !== 'lecturer') {
                return errorResponse(res, 403, 'Forbidden: Only lecturers can update their availability');
            }
            const staff_id = req.user.id;
            const { id } = req.params;
            const updateData = req.body;

            // Check ownership
            const slots = await StaffAvailability.getByStaff(staff_id);
            if (!slots.success) {
                return errorResponse(res, 500, slots.error);
            }
            const slot = slots.data.find(s => s.id === id);
            if (!slot) {
                return errorResponse(res, 404, 'Availability slot not found');
            }

            const result = await StaffAvailability.update(id, updateData);
            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Lecturer ${staff_id} updated availability slot ${id}`);
            response(res, 200, 'Availability slot updated successfully', result.data);
        } catch (error) {
            logger.error('Error updating lecturer availability:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    // Delete a specific availability slot owned by the lecturer
    static async deleteAvailability(req, res) {
        try {
            if (req.user.role !== 'lecturer') {
                return errorResponse(res, 403, 'Forbidden: Only lecturers can delete their availability');
            }

            const staff_id = req.user.id;
            const { id } = req.params;

            if (!id) {
                return errorResponse(res, 400, 'Availability slot ID is required');
            }

            const result = await StaffAvailability.delete(id, staff_id);

            if (!result.success) {
                return errorResponse(res, 400, result.error);
            }

            logger.info(`Lecturer ${staff_id} deleted availability slot ${id}`);
            response(res, 200, 'Availability slot deleted successfully');
        } catch (error) {
            logger.error('Error deleting lecturer availability:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    // Get all active lecturer availability for students (public access)
    static async getLecturerAvailabilityForStudents(req, res) {
        try {
            const result = await StaffAvailability.getAllActiveStaffAvailability();

            if (!result.success) {
                logger.error('Failed to fetch staff availability:', result.error);
                return errorResponse(res, 500, result.error);
            }

            response(res, 200, 'Staff availability fetched successfully', result.data);
        } catch (error) {
            logger.error('Error fetching staff availability for students:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = LecturerAvailabilityController;