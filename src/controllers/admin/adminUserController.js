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
            const { supabase } = require('../../config/database');

            // Check if user exists
            const existingUser = await User.findById(id);
            if (!existingUser.success) {
                return errorResponse(res, 404, 'User not found');
            }

            // Prevent admin from deleting themselves
            if (req.user.id === id) {
                return errorResponse(res, 400, 'Cannot delete your own account');
            }

            logger.info(`Starting deletion process for user ${id}`);

            // Helper function to safely delete from table
            const safeDelete = async (tableName, condition) => {
                try {
                    const { error } = await supabase.from(tableName).delete().match(condition);
                    if (error) {
                        logger.warn(`Error deleting from ${tableName}:`, error.message);
                    } else {
                        logger.info(`Successfully deleted from ${tableName}`);
                    }
                } catch (err) {
                    logger.warn(`Failed to delete from ${tableName}:`, err.message);
                }
            };

            // Delete related records first to avoid foreign key constraint errors
            // Must delete in proper order to handle foreign key constraints
            
            // Step 1: Delete appointments (both as requester and appointee)
            await safeDelete('appointments', { requester_id: id });
            await safeDelete('appointments', { appointee_id: id });
            
            // Step 2: Delete availability slots (try both possible column names)
            await safeDelete('availability_slots', { staff_id: id });
            await safeDelete('staff_availability', { staff_id: id });
            
            // Step 3: Delete survey responses and their answers
            try {
                const { data: surveyResponses } = await supabase
                    .from('survey_responses')
                    .select('id')
                    .eq('user_id', id);
                
                if (surveyResponses && surveyResponses.length > 0) {
                    const responseIds = surveyResponses.map(r => r.id);
                    await safeDelete('survey_answers', { response_id: responseIds });
                    await safeDelete('survey_answer_options', { answer_id: responseIds });
                }
                await safeDelete('survey_responses', { user_id: id });
            } catch (err) {
                logger.warn('Error handling survey responses:', err.message);
            }
            
            // Step 4: Delete posts and related data
            try {
                const { data: userPosts } = await supabase
                    .from('posts')
                    .select('id')
                    .eq('user_id', id);
                
                if (userPosts && userPosts.length > 0) {
                    const postIds = userPosts.map(p => p.id);
                    for (const postId of postIds) {
                        await safeDelete('comments', { post_id: postId });
                        await safeDelete('post_likes', { post_id: postId });
                    }
                }
                await safeDelete('posts', { user_id: id });
            } catch (err) {
                logger.warn('Error handling posts:', err.message);
            }
            
            // Step 5: Delete user's own comments on other posts
            await safeDelete('comments', { user_id: id });
            
            // Step 6: Delete user's post likes
            await safeDelete('post_likes', { user_id: id });
            
            // Step 7: Delete poll votes
            await safeDelete('poll_votes', { user_id: id });
            
            // Step 8: Delete messages (try both column name variations)
            await safeDelete('messages', { sender_id: id });
            await safeDelete('messages', { receiver_id: id });
            await safeDelete('messages', { recipient_id: id });
            
            // Step 9: Delete notifications
            await safeDelete('notifications', { user_id: id });
            
            // Step 10: Delete event participations
            await safeDelete('event_participants', { user_id: id });
            
            // Step 11: Delete feedback
            await safeDelete('feedback', { user_id: id });
            
            // Step 12: Delete forum posts and forum memberships
            await safeDelete('forum_posts', { user_id: id });
            await safeDelete('forum_posts', { author_id: id });
            await safeDelete('forum_members', { user_id: id });
            
            // Step 13: Delete chat group memberships
            await safeDelete('chat_group_members', { user_id: id });
            await safeDelete('group_members', { user_id: id });
            
            // Step 14: Delete any remaining related records
            await safeDelete('audit_logs', { user_id: id });
            await safeDelete('login_history', { user_id: id });
            await safeDelete('attachments', { uploaded_by: id });
            
            logger.info(`Deleted all related records for user ${id}`);

            // Finally, delete the user directly from the users table
            const { error: userError } = await supabase
                .from('users')
                .delete()
                .eq('id', id);
                
            if (userError) {
                logger.error('Failed to delete user from users table:', userError);
                return errorResponse(res, 500, 'Failed to delete user', userError.message);
            }

            logger.info(`Successfully deleted user ${id}`);
            response(res, 200, 'User and all related data deleted permanently', { id });
        } catch (error) {
            logger.error('Delete user error:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
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

    // Ban user
    static async banUser(req, res) {
        try {
            const { id } = req.params;
            const { reason } = req.body;

            // Check if user exists
            const existingUser = await User.findById(id);
            if (!existingUser.success) {
                return errorResponse(res, 404, 'User not found');
            }

            // Prevent admin from banning themselves
            if (req.user.id === id) {
                return errorResponse(res, 400, 'Cannot ban your own account');
            }

            // Ban user by updating status
            const updateData = { status: 'banned', ban_reason: reason || null };
            const result = await User.update(id, updateData);
            if (!result.success) {
                logger.error('Failed to ban user:', result.error);
                return errorResponse(res, 500, 'Failed to ban user', result.error);
            }

            response(res, 200, 'User banned successfully', {
                id: id,
                status: 'banned',
                reason: reason || null
            });
        } catch (error) {
            logger.error('Ban user error:', error);
            errorResponse(res, 500, 'Internal server error', error.message);
        }
    }

    // Unban user
    static async unbanUser(req, res) {
        try {
            const { id } = req.params;

            // Check if user exists
            const existingUser = await User.findById(id);
            if (!existingUser.success) {
                return errorResponse(res, 404, 'User not found');
            }

            // Unban user by updating status to active
            const updateData = { status: 'active', ban_reason: null };
            const result = await User.update(id, updateData);
            if (!result.success) {
                logger.error('Failed to unban user:', result.error);
                return errorResponse(res, 500, 'Failed to unban user', result.error);
            }

            response(res, 200, 'User unbanned successfully', {
                id: id,
                status: 'active'
            });
        } catch (error) {
            logger.error('Unban user error:', error);
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
