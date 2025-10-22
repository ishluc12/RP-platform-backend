const User = require('../../models/User');
const { emitToUser } = require('../../config/socket');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

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
                logger.error('Failed to fetch users:', result.error);
                return errorResponse(res, 500, 'Failed to fetch users', result.error);
            }

            response(res, 200, 'Users retrieved successfully', result.data, result.pagination);
        } catch (error) {
            logger.error('Get all users error:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get user by ID (admin view - full details)
    static async getUserById(req, res) {
        try {
            const { id } = req.params;

            const result = await User.findById(id);
            if (!result.success) {
                return errorResponse(res, 404, 'User not found');
            }

            response(res, 200, 'User retrieved successfully', result.data);
        } catch (error) {
            logger.error('Get user by ID error:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
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
                status = 'active'
            } = req.body;

            // Validate required fields
            if (!name || !email || !password || !role) {
                return errorResponse(res, 400, 'Name, email, password, and role are required');
            }

            // Check if user already exists by email
            const existingUser = await User.findByEmail(email);
            if (existingUser.success) {
                return errorResponse(res, 400, 'User with this email already exists');
            }

            // Check if student_id or staff_id already exists
            if (student_id) {
                const existingStudent = await User.findByStudentId(student_id);
                if (existingStudent.success) {
                    return errorResponse(res, 400, 'Student ID already exists');
                }
            }

            if (staff_id) {
                const existingStaff = await User.findByStaffId(staff_id);
                if (existingStaff.success) {
                    return errorResponse(res, 400, 'Staff ID already exists');
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
                status,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Create user
            const result = await User.create(userData);
            if (!result.success) {
                logger.error('Failed to create user:', result.error);
                return errorResponse(res, 500, 'Failed to create user', result.error);
            }

            // Remove password from response
            const { password_hash, ...userWithoutPassword } = result.data;

            response(res, 201, 'User created successfully', userWithoutPassword);
        } catch (error) {
            logger.error('Create user error:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Update user (admin)
    static async updateUser(req, res) {
        try {
            const { id } = req.params;
            const updateData = { ...req.body };

            // Check if user exists
            const existingUser = await User.findById(id);
            if (!existingUser.success) {
                return errorResponse(res, 404, 'User not found');
            }

            // Check if email is being changed and if it already exists
            if (updateData.email && updateData.email !== existingUser.data.email) {
                const emailCheck = await User.findByEmail(updateData.email);
                if (emailCheck.success) {
                    return errorResponse(res, 400, 'Email already exists');
                }
            }

            // Handle password update if provided
            if (updateData.password) {
                const bcrypt = require('bcryptjs');
                updateData.password_hash = await bcrypt.hash(updateData.password, 12);
                delete updateData.password; // Remove plain password
            }



            // Remove fields that shouldn't be updated via this endpoint
            delete updateData.created_at;

            // Update user
            const result = await User.update(id, updateData);
            if (!result.success) {
                logger.error('Failed to update user:', result.error);
                return errorResponse(res, 500, 'Failed to update user', result.error);
            }

            response(res, 200, 'User updated successfully', result.data);
        } catch (error) {
            logger.error('Update user error:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Delete user (admin)
    static async deleteUser(req, res) {
        try {
            const { id } = req.params;

            // Check if user exists
            const existingUser = await User.findById(id);
            if (!existingUser.success) {
                return errorResponse(res, 404, 'User not found');
            }

            // Prevent admin from deleting themselves
            if (req.user.id === id) {
                return errorResponse(res, 400, 'Cannot delete your own account');
            }

            // Use soft delete (block user) to avoid dependency issues
            const result = await User.update(id, { status: 'blocked' });
            if (!result.success) {
                logger.error('Failed to block user:', result.error);
                return errorResponse(res, 500, 'Failed to block user', result.error);
            }

            response(res, 200, 'User blocked successfully');
        } catch (error) {
            logger.error('Delete user error:', error);
            errorResponse(res, 500, error.message);
        }
    }

    // Bulk update users
    static async bulkUpdateUsers(req, res) {
        try {
            const { userIds, updateData } = req.body;

            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return errorResponse(res, 400, 'User IDs array is required');
            }

            if (!updateData || Object.keys(updateData).length === 0) {
                return errorResponse(res, 400, 'Update data is required');
            }

            // Remove fields that shouldn't be updated
            delete updateData.password_hash;
            delete updateData.created_at;
            delete updateData.email; // Email should ideally be updated via a separate flow

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

            response(res, 200, 'Bulk update completed', {
                successful: results,
                failed: errors,
                total: userIds.length,
                successfulCount: results.length,
                failedCount: errors.length
            });
        } catch (error) {
            logger.error('Bulk update users error:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Bulk delete users
    static async bulkDeleteUsers(req, res) {
        try {
            const { userIds } = req.body;

            if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
                return errorResponse(res, 400, 'User IDs array is required');
            }

            // Prevent admin from deleting themselves
            if (userIds.includes(req.user.id)) {
                return errorResponse(res, 400, 'Cannot delete your own account');
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

            response(res, 200, 'Bulk delete completed', {
                successful: results,
                failed: errors,
                total: userIds.length,
                successfulCount: results.length,
                failedCount: errors.length
            });
        } catch (error) {
            logger.error('Bulk delete users error:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Get user statistics and analytics
    static async getUserAnalytics(req, res) {
        try {
            const { period = '30d' } = req.query;

            // Get basic user stats
            const statsResult = await User.getStats();
            if (!statsResult.success) {
                return errorResponse(res, 500, 'Failed to get user statistics', statsResult.error);
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

            response(res, 200, 'User analytics retrieved successfully', analytics);
        } catch (error) {
            logger.error('Get user analytics error:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
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
                return errorResponse(res, 500, 'Failed to fetch users for export', result.error);
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
                status: user.status,
                created_at: user.created_at,
                updated_at: user.updated_at
            }));

            if (format === 'csv') {
                // Convert to CSV format
                const { stringify } = require('csv-stringify'); // Destructure for direct use
                stringify(exportData, { header: true }, (err, csvString) => {
                    if (err) {
                        logger.error('Failed to generate CSV:', err);
                        return errorResponse(res, 500, 'Failed to generate CSV', err.message);
                    }

                    res.setHeader('Content-Type', 'text/csv');
                    res.setHeader('Content-Disposition', 'attachment; filename=users.csv');
                    res.send(csvString);
                });
            } else {
                // Return JSON
                response(res, 200, 'Users exported successfully', {
                    data: exportData,
                    total: exportData.length,
                    exportedAt: new Date().toISOString()
                });
            }
        } catch (error) {
            logger.error('Export users error:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
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
                return errorResponse(res, 404, 'User not found');
            }

            // Prevent admin from suspending themselves
            if (req.user.id === id) {
                return errorResponse(res, 400, 'Cannot change your own status');
            }

            const updateData = { status: isActive ? 'active' : 'blocked' };
            if (reason !== undefined) updateData.suspension_reason = reason;

            // Update user status
            const result = await User.update(id, updateData);
            if (!result.success) {
                logger.error('Failed to update user status:', result.error);
                return errorResponse(res, 500, 'Failed to update user status', result.error);
            }

            response(res, 200, `User ${isActive ? 'activated' : 'suspended'} successfully`, {
                id: id,
                status: isActive ? 'active' : 'blocked',
                reason: reason || null
            });
        } catch (error) {
            logger.error('Toggle user status error:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
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
                return errorResponse(res, 404, 'User not found');
            }

            // In a real application, you'd fetch activity logs from a logs table
            // For now, we'll return a placeholder response
            response(res, 200, 'User activity logs functionality not implemented yet', {
                userId: id,
                logs: [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: 0,
                    totalPages: 0
                }
            });
        } catch (error) {
            logger.error('Get user activity logs error:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }
}

module.exports = AdminUserController;
