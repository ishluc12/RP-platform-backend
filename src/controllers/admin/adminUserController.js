const User = require('../../models/User');
const { emitToUser } = require('../../config/socket');

class AdminUserController {
    // Get all users with advanced filtering and pagination
    static async getAllUsers(req, res) {
        try {
            const {
                page = 1,
                limit = 20,
                role,
                department,
                search,
                status,
                sortBy = 'created_at',
                sortOrder = 'desc'
            } = req.query;

            const filters = {};
            if (role) filters.role = role;
            if (department) filters.department = department;
            if (search) filters.search = search;
            if (status) filters.status = status;

            const result = await User.findAll(parseInt(page), parseInt(limit), filters);
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch users',
                    error: result.error
                });
            }

            res.json({
                success: true,
                data: result.data,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Get all users error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get user by ID (admin view - full details)
    static async getUserById(req, res) {
        try {
            const { id } = req.params;

            const result = await User.findById(id);
            if (!result.success) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            res.json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('Get user by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Create new user (admin)
    static async createUser(req, res) {
        try {
            const {
                name,
                email,
                password,
                role,
                department,
                student_id,
                staff_id,
                phone,
                bio,
                isActive = true
            } = req.body;

            // Validate required fields
            if (!name || !email || !password || !role) {
                return res.status(400).json({
                    success: false,
                    message: 'Name, email, password, and role are required'
                });
            }

            // Check if user already exists
            const existingUser = await User.findByEmail(email);
            if (existingUser.success) {
                return res.status(400).json({
                    success: false,
                    message: 'User with this email already exists'
                });
            }

            // Check if student_id or staff_id already exists
            if (student_id) {
                const existingStudent = await User.findByStudentId(student_id);
                if (existingStudent.success) {
                    return res.status(400).json({
                        success: false,
                        message: 'Student ID already exists'
                    });
                }
            }

            if (staff_id) {
                const existingStaff = await User.findByStaffId(staff_id);
                if (existingStaff.success) {
                    return res.status(400).json({
                        success: false,
                        message: 'Staff ID already exists'
                    });
                }
            }

            // Hash password
            const bcrypt = require('bcryptjs');
            const hashedPassword = await bcrypt.hash(password, 12);

            // Create user data
            const userData = {
                name,
                email: email.toLowerCase(),
                password_hash: hashedPassword,
                role,
                department,
                student_id,
                staff_id,
                phone,
                bio,
                is_active: isActive,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Create user
            const result = await User.create(userData);
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create user',
                    error: result.error
                });
            }

            // Remove password from response
            const { password_hash, ...userWithoutPassword } = result.data;

            res.status(201).json({
                success: true,
                message: 'User created successfully',
                data: userWithoutPassword
            });
        } catch (error) {
            console.error('Create user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Update user (admin)
    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const updateData = req.body;

            // Check if user exists
            const existingUser = await User.findById(id);
            if (!existingUser.success) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Remove fields that shouldn't be updated
            delete updateData.password_hash;
            delete updateData.created_at;

            // Update user
            const result = await User.update(id, updateData);
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update user',
                    error: result.error
                });
            }

            res.json({
                success: true,
                message: 'User updated successfully',
                data: result.data
            });
        } catch (error) {
            console.error('Update user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Delete user (admin)
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;

            // Check if user exists
            const existingUser = await User.findById(id);
            if (!existingUser.success) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Prevent admin from deleting themselves
            if (req.user.id === parseInt(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete your own account'
                });
            }

            // Delete user
            const result = await User.delete(id);
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to delete user',
                    error: result.error
                });
            }

            res.json({
                success: true,
                message: 'User deleted successfully'
            });
        } catch (error) {
            console.error('Delete user error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Bulk update users
    static async bulkUpdateUsers(req, res) {
        try {
            const { userIds, updateData } = req.body;

            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'User IDs array is required'
                });
            }

            if (!updateData || Object.keys(updateData).length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'Update data is required'
                });
            }

            // Remove fields that shouldn't be updated
            delete updateData.password_hash;
            delete updateData.created_at;

            const results = [];
            const errors = [];

            // Update each user
            for (const userId of userIds) {
                try {
                    const result = await User.update(userId, updateData);
                    if (result.success) {
                        results.push({ userId, success: true, data: result.data });
                    } else {
                        errors.push({ userId, success: false, error: result.error });
                    }
                } catch (error) {
                    errors.push({ userId, success: false, error: error.message });
                }
            }

            res.json({
                success: true,
                message: 'Bulk update completed',
                data: {
                    successful: results,
                    failed: errors,
                    total: userIds.length,
                    successfulCount: results.length,
                    failedCount: errors.length
                }
            });
        } catch (error) {
            console.error('Bulk update users error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Bulk delete users
    static async bulkDeleteUsers(req, res) {
        try {
            const { userIds } = req.body;

            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: 'User IDs array is required'
                });
            }

            // Prevent admin from deleting themselves
            if (userIds.includes(req.user.id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot delete your own account'
                });
            }

            const results = [];
            const errors = [];

            // Delete each user
            for (const userId of userIds) {
                try {
                    const result = await User.delete(userId);
                    if (result.success) {
                        results.push({ userId, success: true });
                    } else {
                        errors.push({ userId, success: false, error: result.error });
                    }
                } catch (error) {
                    errors.push({ userId, success: false, error: error.message });
                }
            }

            res.json({
                success: true,
                message: 'Bulk delete completed',
                data: {
                    successful: results,
                    failed: errors,
                    total: userIds.length,
                    successfulCount: results.length,
                    failedCount: errors.length
                }
            });
        } catch (error) {
            console.error('Bulk delete users error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get user statistics and analytics
    static async getUserAnalytics(req, res) {
        try {
            const { period = '30d' } = req.query;

            // Get basic user stats
            const statsResult = await User.getStats();
            if (!statsResult.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get user statistics',
                    error: statsResult.error
                });
            }

            // In a real application, you'd calculate more analytics
            // For now, we'll return basic stats
            const analytics = {
                totalUsers: statsResult.data.total,
                byRole: statsResult.data.byRole,
                byDepartment: statsResult.data.byDepartment,
                period,
                generatedAt: new Date().toISOString()
            };

            res.json({
                success: true,
                data: analytics
            });
        } catch (error) {
            console.error('Get user analytics error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Export users data
    static async exportUsers(req, res) {
        try {
            const { format = 'json', role, department } = req.query;

            const filters = {};
            if (role) filters.role = role;
            if (department) filters.department = department;

            // Get all users (no pagination for export)
            const result = await User.findAll(1, 10000, filters);
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to fetch users for export',
                    error: result.error
                });
            }

            // Remove sensitive information
            const exportData = result.data.map(user => ({
                id: user.id,
                name: user.name,
                email: user.email,
                role: user.role,
                department: user.department,
                student_id: user.student_id,
                staff_id: user.staff_id,
                phone: user.phone,
                bio: user.bio,
                is_active: user.is_active,
                created_at: user.created_at,
                updated_at: user.updated_at
            }));

            if (format === 'csv') {
                // Convert to CSV format
                const csv = require('csv-stringify');
                csv.stringify(exportData, { header: true }, (err, csvString) => {
                    if (err) {
                        return res.status(500).json({
                            success: false,
                            message: 'Failed to generate CSV',
                            error: err.message
                        });
                    }

                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
                    res.send(csvString);
                });
            } else {
                // Return JSON
                res.json({
                    success: true,
                    data: exportData,
                    total: exportData.length,
                    exportedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Export users error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Suspend/Activate user
    static async toggleUserStatus(req, res) {
        try {
            const { id } = req.params;
            const { isActive, reason } = req.body;

            // Check if user exists
            const existingUser = await User.findById(id);
            if (!existingUser.success) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // Prevent admin from suspending themselves
            if (req.user.id === parseInt(id)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot change your own status'
                });
            }

            const updateData = { is_active: isActive };
            if (reason) updateData.suspension_reason = reason;

            // Update user status
            const result = await User.update(id, updateData);
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update user status',
                    error: result.error
                });
            }

            res.json({
                success: true,
                message: `User ${isActive ? 'activated' : 'suspended'} successfully`,
                data: {
                    id: parseInt(id),
                    is_active: isActive,
                    reason: reason || null
                }
            });
        } catch (error) {
            console.error('Toggle user status error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get user activity logs (placeholder)
    static async getUserActivityLogs(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 20 } = req.query;

            // Check if user exists
            const existingUser = await User.findById(id);
            if (!existingUser.success) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // In a real application, you'd fetch activity logs from a logs table
            // For now, we'll return a placeholder response
            res.json({
                success: true,
                message: 'User activity logs functionality not implemented yet',
                data: {
                    userId: parseInt(id),
                    logs: [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        totalPages: 0
                    }
                }
            });
        } catch (error) {
            console.error('Get user activity logs error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = AdminUserController;
