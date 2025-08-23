const { supabase } = require('../config/database');

class User {
    /** Create a new user */
    static async create(userData) {
        try {
            // Only insert fields that match your DB schema
            const {
                name,
                email,
                password_hash,
                role = 'student',
                profile_picture,
                bio
            } = userData;

            const insertData = {
                name,
                email,
                password_hash,
                role,
                profile_picture,
                bio,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data, error } = await supabase
                .from('users')
                .insert([insertData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Get user by ID */
    static async findById(id) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Get user by email */
    static async findByEmail(email) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Get users with pagination and optional filters */
    static async findAll(page = 1, limit = 10, filters = {}) {
        try {
            let query = supabase.from('users').select('*', { count: 'exact' }).order('created_at', { ascending: false });

            if (filters.role) query = query.eq('role', filters.role);
            if (filters.department) query = query.eq('department', filters.department);
            if (filters.search) query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);

            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error, count } = await query.range(from, to);
            if (error) throw error;

            return {
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Update user by ID */
    static async update(id, updateData) {
        // Only update allowed fields!
        const allowedFields = ['name', 'role', 'profile_picture', 'bio'];
        const filteredUpdate = {};
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) filteredUpdate[field] = updateData[field];
        });
        filteredUpdate.updated_at = new Date().toISOString();

        try {
            const { data, error } = await supabase
                .from('users')
                .update(filteredUpdate)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Delete user by ID */
    static async delete(id) {
        try {
            const { error } = await supabase.from('users').delete().eq('id', id);
            if (error) throw error;
            return { success: true, message: 'User deleted successfully' };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Update profile picture */
    static async updateProfilePicture(id, profilePictureUrl) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({ profile_picture: profilePictureUrl, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select('id, profile_picture')
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Change password */
    static async changePassword(id, newPasswordHash) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select('id')
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Get user statistics grouped by role and department */
    static async getStats() {
        try {
            const { data, error } = await supabase.from('users').select('role, department');
            if (error) throw error;

            const stats = { total: data.length, byRole: {}, byDepartment: {} };
            data.forEach(user => {
                stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
                if (user.department) stats.byDepartment[user.department] = (stats.byDepartment[user.department] || 0) + 1;
            });

            return { success: true, data: stats };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }
}

module.exports = User;