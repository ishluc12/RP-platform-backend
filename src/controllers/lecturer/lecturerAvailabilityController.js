const { supabase } = require('../../config/database');

// Create or bulk insert availability slots for the authenticated lecturer
const createAvailability = async (req, res) => {
    try {
        const lecturerId = req.user.id;
        const { slots } = req.body; // [{ available_from, available_to, recurring }]

        if (!Array.isArray(slots) || slots.length === 0) {
            return res.status(400).json({ success: false, message: 'slots array is required' });
        }

        for (const slot of slots) {
            if (!slot.available_from || !slot.available_to) {
                return res.status(400).json({ success: false, message: 'Each slot must include available_from and available_to' });
            }
        }

        const rows = slots.map((slot) => ({
            lecturer_id: lecturerId,
            available_from: slot.available_from,
            available_to: slot.available_to,
            recurring: !!slot.recurring
        }));

        const { data, error } = await supabase
            .from('lecturer_availability')
            .insert(rows)
            .select('*');

        if (error) throw error;

        return res.status(201).json({ success: true, data });
    } catch (error) {
        console.error('Error creating availability:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Get all availability slots for the authenticated lecturer
const getMyAvailability = async (req, res) => {
    try {
        const lecturerId = req.user.id;

        const { data, error } = await supabase
            .from('lecturer_availability')
            .select('*')
            .eq('lecturer_id', lecturerId)
            .order('available_from', { ascending: true });

        if (error) throw error;

        return res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching availability:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Update a specific availability slot owned by the authenticated lecturer
const updateAvailability = async (req, res) => {
    try {
        const lecturerId = req.user.id;
        const slotId = Number(req.params.id);
        const { available_from, available_to, recurring } = req.body;

        if (Number.isNaN(slotId)) {
            return res.status(400).json({ success: false, message: 'Invalid slot ID' });
        }

        const updates = {};
        if (available_from !== undefined) updates.available_from = available_from;
        if (available_to !== undefined) updates.available_to = available_to;
        if (recurring !== undefined) updates.recurring = !!recurring;

        if (Object.keys(updates).length === 0) {
            return res.status(400).json({ success: false, message: 'No fields provided to update' });
        }

        const { data, error } = await supabase
            .from('lecturer_availability')
            .update(updates)
            .eq('id', slotId)
            .eq('lecturer_id', lecturerId)
            .select('*');

        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: 'Slot not found or not authorized' });
        }

        return res.json({ success: true, data: data[0] });
    } catch (error) {
        console.error('Error updating availability:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Delete a specific availability slot owned by the authenticated lecturer
const deleteAvailability = async (req, res) => {
    try {
        const lecturerId = req.user.id;
        const slotId = Number(req.params.id);

        if (Number.isNaN(slotId)) {
            return res.status(400).json({ success: false, message: 'Invalid slot ID' });
        }

        const { data, error } = await supabase
            .from('lecturer_availability')
            .delete()
            .eq('id', slotId)
            .eq('lecturer_id', lecturerId)
            .select('*');

        if (error) throw error;
        if (!data || data.length === 0) {
            return res.status(404).json({ success: false, message: 'Slot not found or not authorized' });
        }

        return res.json({ success: true, message: 'Slot deleted successfully', data: data[0] });
    } catch (error) {
        console.error('Error deleting availability:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    createAvailability,
    getMyAvailability,
    updateAvailability,
    deleteAvailability
};


