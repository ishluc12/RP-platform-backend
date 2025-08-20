const { supabase } = require('../config/database');

class User {
    // Create a new user
    static async create(userData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .insert([userData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error creating user:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user by ID
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
            console.error('Error finding user by ID:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user by email
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
            console.error('Error finding user by email:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user by student ID
    static async findByStudentId(studentId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('student_id', studentId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error finding user by student ID:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user by staff ID
    static async findByStaffId(staffId) {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('staff_id', staffId)
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error finding user by staff ID:', error);
            return { success: false, error: error.message };
        }
    }

    // Get all users with pagination
    static async findAll(page = 1, limit = 10, filters = {}) {
        try {
            let query = supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });

            // Apply filters
            if (filters.role) {
                query = query.eq('role', filters.role);
            }
            if (filters.department) {
                query = query.eq('department', filters.department);
            }
            if (filters.search) {
                query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
            }

            // Apply pagination
            const offset = (page - 1) * limit;
            query = query.range(offset, offset + limit - 1);

            const { data, error, count } = await query;

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
            console.error('Error finding users:', error);
            return { success: false, error: error.message };
        }
    }

    // Update user
    static async update(id, updateData) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    ...updateData,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating user:', error);
            return { success: false, error: error.message };
        }
    }

    // Delete user
    static async delete(id) {
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', id);

            if (error) throw error;
            return { success: true, message: 'User deleted successfully' };
        } catch (error) {
            console.error('Error deleting user:', error);
            return { success: false, error: error.message };
        }
    }

    // Get users by role
    static async findByRole(role, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const { data, error, count } = await supabase
                .from('users')
                .select('*')
                .eq('role', role)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

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
            console.error('Error finding users by role:', error);
            return { success: false, error: error.message };
        }
    }

    // Get users by department
    static async findByDepartment(department, page = 1, limit = 10) {
        try {
            const offset = (page - 1) * limit;

            const { data, error, count } = await supabase
                .from('users')
                .select('*')
                .eq('department', department)
                .order('created_at', { ascending: false })
                .range(offset, offset + limit - 1);

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
            console.error('Error finding users by department:', error);
            return { success: false, error: error.message };
        }
    }

    // Update user profile picture
    static async updateProfilePicture(id, profilePictureUrl) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    profile_picture: profilePictureUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select('id, profile_picture')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error updating profile picture:', error);
            return { success: false, error: error.message };
        }
    }

    // Change password
    static async changePassword(id, newPasswordHash) {
        try {
            const { data, error } = await supabase
                .from('users')
                .update({
                    password_hash: newPasswordHash,
                    updated_at: new Date().toISOString()
                })
                .eq('id', id)
                .select('id')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Error changing password:', error);
            return { success: false, error: error.message };
        }
    }

    // Get user statistics
    static async getStats() {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('role, department');

            if (error) throw error;

            const stats = {
                total: data.length,
                byRole: {},
                byDepartment: {}
            };

            data.forEach(user => {
                // Count by role
                stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;

                // Count by department
                if (user.department) {
                    stats.byDepartment[user.department] = (stats.byDepartment[user.department] || 0) + 1;
                }
            });

            return { success: true, data: stats };
        } catch (error) {
            console.error('Error getting user stats:', error);
            return { success: false, error: error.message };
        }
    }
}

module.exports = User;