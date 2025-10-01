const { supabase, supabaseAdmin } = require('../config/database');
const { logger } = require('../utils/logger.js');

const db = supabaseAdmin || supabase;

class StaffAvailability {
    constructor(data) {
        this.id = data.id;
        this.staff_id = data.staff_id;
        this.day_of_week = data.day_of_week;
        this.week_of_month = data.week_of_month;
        this.start_time = data.start_time;
        this.end_time = data.end_time;
        this.max_regular_students = data.max_regular_students;
        this.max_emergency_students = data.max_emergency_students;
        this.allow_emergency = data.allow_emergency;
        this.is_active = data.is_active;
    }

    static async checkOverlap(staffId, dayOfWeek, startTime, endTime, weekOfMonth = null, excludeSlotId = null) {
        try {
            const client = supabaseAdmin || supabase;
            let query = client
                .from('staff_availability')
                .select('id', { count: 'exact' })
                .eq('staff_id', staffId)
                .eq('day_of_week', dayOfWeek)
                .or(`start_time.lte.${endTime},end_time.gte.${startTime}`); // Overlap condition

            // If week_of_month is specified, check overlap only for the same week
            if (weekOfMonth !== null) {
                query = query.eq('week_of_month', weekOfMonth);
            } else {
                // If not specified, check for slots without week_of_month (backward compatibility)
                query = query.is('week_of_month', null);
            }

            if (excludeSlotId) {
                query = query.not('id', 'eq', excludeSlotId);
            }

            const { count, error } = await query;

            if (error) {
                logger.error('Error checking for overlapping availability:', error);
                return { success: false, error: error.message };
            }

            return { success: true, overlap: count > 0 };
        } catch (error) {
            logger.error('Exception checking for overlapping availability:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async create(data) {
        try {
            // Use admin client to bypass RLS policies
            const client = supabaseAdmin || supabase;

            // Validate incoming data
            const { staff_id, day_of_week, week_of_month, start_time, end_time, max_regular_students, max_emergency_students, allow_emergency, is_active } = data;
            if (!staff_id || !day_of_week || !start_time || !end_time || max_regular_students === undefined || max_emergency_students === undefined || allow_emergency === undefined || is_active === undefined) {
                return { success: false, error: "Missing required fields for availability slot." };
            }

            // Validate week_of_month if provided
            if (week_of_month !== undefined && week_of_month !== null) {
                const weekNum = parseInt(week_of_month);
                if (isNaN(weekNum) || weekNum < 1 || weekNum > 5) {
                    return { success: false, error: "week_of_month must be between 1 and 5." };
                }
            }

            // Check for overlapping slots
            const { success: overlapSuccess, overlap, error: overlapError } = await this.checkOverlap(staff_id, day_of_week, start_time, end_time, week_of_month);

            if (!overlapSuccess) {
                return { success: false, error: overlapError };
            }
            if (overlap) {
                return { success: false, error: "Availability slot overlaps with an existing slot." };
            }

            const insertData = {
                staff_id,
                day_of_week,
                start_time,
                end_time,
                max_regular_students,
                max_emergency_students,
                allow_emergency,
                is_active
            };

            if (week_of_month !== undefined) {
                insertData.week_of_month = week_of_month;
            }

            const { data: newSlot, error } = await client
                .from('staff_availability')
                .insert([insertData])
                .select()
                .single();

            if (error) {
                logger.error('Error creating availability:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: new StaffAvailability(newSlot) };
        } catch (error) {
            logger.error('Error creating availability:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async findByStaffId(staffId) {
        try {
            const { data, error } = await db
                .from('staff_availability')
                .select('*')
                .eq('staff_id', staffId);

            if (error) {
                logger.error('Error fetching availability by staff ID:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data.map(slot => new StaffAvailability(slot)) };
        } catch (error) {
            logger.error('Error fetching availability by staff ID:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async findByStaffIdAndDay(staffId, dayOfWeek) {
        try {
            const { data, error } = await db
                .from('staff_availability')
                .select('*')
                .eq('staff_id', staffId)
                .eq('day_of_week', dayOfWeek);

            if (error) {
                logger.error('Error fetching availability by staff ID and day:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: data.map(slot => new StaffAvailability(slot)) };
        } catch (error) {
            logger.error('Error fetching availability by staff ID and day:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async findById(id) {
        try {
            const { data, error } = await db
                .from('staff_availability')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                logger.error('Error fetching availability by ID:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: new StaffAvailability(data) };
        } catch (error) {
            logger.error('Error fetching availability by ID:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async update(id, updates) {
        try {
            // Use admin client to bypass RLS policies
            const client = supabaseAdmin || supabase;
            const { data, error } = await client
                .from('staff_availability')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) {
                logger.error('Error updating availability:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: new StaffAvailability(data) };
        } catch (error) {
            logger.error('Error updating availability:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async delete(id) {
        try {
            // Use admin client to bypass RLS policies
            const client = supabaseAdmin || supabase;
            const { error } = await client
                .from('staff_availability')
                .delete()
                .eq('id', id);

            if (error) {
                logger.error('Error deleting availability:', error);
                return { success: false, error: error.message };
            }
            return { success: true, data: { id } };
        } catch (error) {
            logger.error('Error deleting availability:', error.message);
            return { success: false, error: error.message };
        }
    }

    static async getAllActiveLecturerAvailability() {
        try {
            const { data, error } = await db
                .from('staff_availability')
                .select(`
                    *,
                    staff:users(id, name, email, role)
                `)
                .eq('is_active', true)
                .order('day_of_week', { ascending: true })
                .order('start_time', { ascending: true });

            if (error) {
                logger.error('Error fetching all active lecturer availability:', error);
                return { success: false, error: error.message };
            }
            
            // Log the fetched data for debugging
            logger.info(`Fetched ${data?.length || 0} active availability slots`);
            if (data && data.length > 0) {
                const roleBreakdown = data.reduce((acc, slot) => {
                    const role = slot.staff?.role || 'unknown';
                    acc[role] = (acc[role] || 0) + 1;
                    return acc;
                }, {});
                logger.info('Availability slots by role:', roleBreakdown);
            }
            
            return { success: true, data: data.map(slot => ({ ...new StaffAvailability(slot), staff: slot.staff })) };
        } catch (error) {
            logger.error('Exception in getAllActiveLecturerAvailability:', error.message);
            return { success: false, error: error.message };
        }
    }
}

module.exports = StaffAvailability;