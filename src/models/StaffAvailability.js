const { supabase } = require('../config/database');

class StaffAvailability {
    /**
     * Create availability slot
     */
    static async create(availabilityData) {
        try {
            const { data, error } = await supabase
                .from('staff_availability')
                .insert([availabilityData])
                .select(`
                    *,
                    staff:staff_id(id, name, email, department, role)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get availability by staff ID
     */
    static async getByStaff(staffId, filters = {}) {
        try {
            let query = supabase
                .from('staff_availability')
                .select(`
                    *,
                    staff:staff_id(id, name, email, department, role)
                `)
                .eq('staff_id', staffId);

            if (filters.day_of_week !== undefined) {
                query = query.eq('day_of_week', filters.day_of_week);
            }

            if (filters.is_active !== undefined) {
                query = query.eq('is_active', filters.is_active);
            }

            if (filters.availability_type) {
                query = query.eq('availability_type', filters.availability_type);
            }

            // Add specific_date filter if provided
            if (filters.specific_date) {
                query = query.eq('specific_date', filters.specific_date);
            }

            // Filter by date range if provided
            if (filters.from_date) {
                query = query.gte('specific_date', filters.from_date);
            }
            if (filters.to_date) {
                query = query.lte('specific_date', filters.to_date);
            }

            const { data, error } = await query.order('specific_date', { nullsFirst: false }).order('day_of_week').order('start_time');

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get availability by staff ID (alias for getByStaff)
     */
    static async findByStaffId(staffId) {
        return this.getByStaff(staffId);
    }

    /**
     * Get availability by staff ID and day
     */
    static async findByStaffIdAndDay(staffId, dayOfWeek) {
        return this.getByStaff(staffId, { day_of_week: dayOfWeek });
    }

    /**
     * Find one availability slot by ID
     */
    static async findOne(slotId) {
        try {
            const { data, error } = await supabase
                .from('staff_availability')
                .select(`
                    *,
                    staff:staff_id(id, name, email, department, role)
                `)
                .eq('id', slotId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') {
                    return { success: false, error: 'Availability slot not found' };
                }
                throw error;
            }
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all availability (sys-admin)
     */
    static async getAll(filters = {}) {
        try {
            let query = supabase
                .from('staff_availability')
                .select(`
                    *,
                    staff:staff_id(id, name, email, department, role)
                `);

            if (filters.staff_id) query = query.eq('staff_id', filters.staff_id);
            if (filters.day_of_week !== undefined) query = query.eq('day_of_week', filters.day_of_week);
            if (filters.is_active !== undefined) query = query.eq('is_active', filters.is_active);
            if (filters.availability_type) query = query.eq('availability_type', filters.availability_type);

            const { data, error } = await query
                .order('staff_id')
                .order('day_of_week')
                .order('start_time');

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all active staff availability
     */
    static async getAllActiveStaffAvailability() {
        try {
            const { data, error } = await supabase
                .from('staff_availability')
                .select(`
                    *,
                    staff:staff_id(id, name, email, department, role)
                `)
                .eq('is_active', true)
                .order('staff_id')
                .order('day_of_week')
                .order('start_time');

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Update availability slot
     */
    static async update(slotId, updates) {
        try {
            const { data, error } = await supabase
                .from('staff_availability')
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq('id', slotId)
                .select(`
                    *,
                    staff:staff_id(id, name, email, department, role)
                `)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Toggle active status
     */
    static async toggleActive(slotId, isActive) {
        try {
            const { data, error } = await supabase
                .from('staff_availability')
                .update({
                    is_active: isActive,
                    updated_at: new Date().toISOString()
                })
                .eq('id', slotId)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete availability slot
     */
    static async delete(slotId) {
        try {
            const { error } = await supabase
                .from('staff_availability')
                .delete()
                .eq('id', slotId);

            if (error) throw error;
            return { success: true, message: 'Availability slot deleted successfully' };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Bulk create availability slots
     */
    static async bulkCreate(staffId, slots) {
        try {
            const slotsWithStaffId = slots.map(slot => ({
                ...slot,
                staff_id: staffId
            }));

            const { data, error } = await supabase
                .from('staff_availability')
                .insert(slotsWithStaffId)
                .select();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get availability summary
     */
    static async getSummary(staffId) {
        try {
            const { data, error } = await supabase
                .from('staff_availability')
                .select('*')
                .eq('staff_id', staffId);

            if (error) throw error;

            const summary = {
                total_slots: data.length,
                active_slots: data.filter(s => s.is_active).length,
                inactive_slots: data.filter(s => !s.is_active).length,
                by_day: {}
            };

            for (let i = 0; i < 7; i++) {
                const daySlots = data.filter(s => s.day_of_week === i && s.is_active);
                summary.by_day[i] = {
                    count: daySlots.length,
                    total_hours: daySlots.reduce((acc, s) => {
                        const start = new Date(`2000-01-01T${s.start_time}`);
                        const end = new Date(`2000-01-01T${s.end_time}`);
                        return acc + (end - start) / (1000 * 60 * 60);
                    }, 0)
                };
            }

            return { success: true, data: summary };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get coverage statistics (sys-admin)
     */
    static async getCoverageStats() {
        try {
            const { data, error } = await supabase
                .from('v_staff_availability_summary')
                .select('*');

            if (error) throw error;
            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get available staff for a specific date/time slot
     */
    static async getAvailableStaff(date, startTime, endTime, role = null, availabilityType = null) {
        try {
            const dayOfWeek = new Date(date).getDay();
            
            let query = supabase
                .from('staff_availability')
                .select(`
                    *,
                    staff:staff_id(id, name, email, department, role)
                `)
                .eq('is_active', true)
                .eq('day_of_week', dayOfWeek)
                .lte('start_time', startTime)
                .gte('end_time', endTime);

            if (availabilityType) {
                query = query.eq('availability_type', availabilityType);
            }

            const { data, error } = await query;

            if (error) throw error;

            // Filter by role if specified
            let staffList = data || [];
            if (role) {
                staffList = staffList.filter(slot => slot.staff?.role === role);
            }

            // Get unique staff members
            const uniqueStaff = [];
            const staffIds = new Set();
            
            for (const slot of staffList) {
                if (slot.staff && !staffIds.has(slot.staff.id)) {
                    staffIds.add(slot.staff.id);
                    uniqueStaff.push(slot.staff);
                }
            }

            return { success: true, data: uniqueStaff };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Delete past availability slots (cleanup)
     * Removes slots with specific_date that are in the past
     * Also removes old recurring slots (without specific_date)
     */
    static async deletePastSlots() {
        try {
            const today = new Date().toISOString().split('T')[0];
            
            // Delete past date-specific slots
            const { data: pastSlots, error: pastError } = await supabase
                .from('staff_availability')
                .delete()
                .lt('specific_date', today)
                .not('specific_date', 'is', null)
                .select();

            if (pastError) throw pastError;
            
            // Delete old recurring slots (without specific_date) - we don't use them anymore
            const { data: recurringSlots, error: recurringError } = await supabase
                .from('staff_availability')
                .delete()
                .is('specific_date', null)
                .select();

            if (recurringError) throw recurringError;
            
            const totalDeleted = (pastSlots?.length || 0) + (recurringSlots?.length || 0);
            console.log(`🗑️ Deleted ${pastSlots?.length || 0} past slots + ${recurringSlots?.length || 0} recurring slots = ${totalDeleted} total`);
            
            return { success: true, data: [...(pastSlots || []), ...(recurringSlots || [])], count: totalDeleted };
        } catch (error) {
            console.error('Error deleting past slots:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = StaffAvailability;