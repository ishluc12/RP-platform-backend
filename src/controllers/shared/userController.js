const User = require('../../models/User');
const { emitToUser } = require('../../config/socket');

class UserController {
    // Get user by ID (public profile)
    static async getUserById(req, res) {
        try {
            const { id } = req.params;
            const currentUserId = req.user.id;

            const result = await User.findById(id);
            if (!result.success) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            const user = result.data;

            // Remove sensitive information for public profile
            const publicProfile = {
                id: user.id,
                name: user.name,
                role: user.role,
                department: user.department,
                profile_picture: user.profile_picture,
                bio: user.bio,
                created_at: user.created_at
            };

            // Add student_id or staff_id if current user is admin or same user
            if (req.user.role === 'admin' || currentUserId === parseInt(id)) {
                if (user.student_id) publicProfile.student_id = user.student_id;
                if (user.staff_id) publicProfile.staff_id = user.staff_id;
                if (user.phone) publicProfile.phone = user.phone;
                if (user.email) publicProfile.email = user.email;
                if (user.updated_at) publicProfile.updated_at = user.updated_at;
            }

            res.json({
                success: true,
                data: publicProfile
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

    // Update user profile
    static async updateUserProfile(req, res) {
        try {
            const userId = req.user.id; // Get ID from authenticated user
            const updates = req.body; // Body contains the fields to update

            const result = await User.update(userId, updates);
            if (!result.success) {
                return res.status(400).json({
                    success: false,
                    message: result.error
                });
            }

            res.json({
                success: true,
                message: 'Profile updated successfully',
                data: result.data
            });
        } catch (error) {
            console.error('Update user profile error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Search users
    static async searchUsers(req, res) {
        try {
            const {
                query,
                role,
                department,
                page = 1,
                limit = 10
            } = req.query;

            const filters = {};
            if (query) filters.search = query;
            if (role) filters.role = role;
            if (department) filters.department = department;

            const result = await User.findAll(parseInt(page), parseInt(limit), filters);
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to search users',
                    error: result.error
                });
            }

            // Remove sensitive information from search results
            const sanitizedUsers = result.data.map(user => ({
                id: user.id,
                name: user.name,
                role: user.role,
                department: user.department,
                profile_picture: user.profile_picture,
                bio: user.bio,
                created_at: user.created_at
            }));

            res.json({
                success: true,
                data: sanitizedUsers,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Search users error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get users by role
    static async getUsersByRole(req, res) {
        try {
            const { role } = req.params;
            const { page = 1, limit = 10 } = req.query;

            // Validate role
            const validRoles = ['student', 'lecturer', 'admin'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid role. Must be student, lecturer, or admin'
                });
            }

            const result = await User.findByRole(role, parseInt(page), parseInt(limit));
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get users by role',
                    error: result.error
                });
            }

            // Remove sensitive information
            const sanitizedUsers = result.data.map(user => ({
                id: user.id,
                name: user.name,
                role: user.role,
                department: user.department,
                profile_picture: user.profile_picture,
                bio: user.bio,
                created_at: user.created_at
            }));

            res.json({
                success: true,
                data: sanitizedUsers,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Get users by role error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get users by department
    static async getUsersByDepartment(req, res) {
        try {
            const { department } = req.params;
            const { page = 1, limit = 10 } = req.query;

            const result = await User.findByDepartment(department, parseInt(page), parseInt(limit));
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get users by department',
                    error: result.error
                });
            }

            // Remove sensitive information
            const sanitizedUsers = result.data.map(user => ({
                id: user.id,
                name: user.name,
                role: user.role,
                department: user.department,
                profile_picture: user.profile_picture,
                bio: user.bio,
                created_at: user.created_at
            }));

            res.json({
                success: true,
                data: sanitizedUsers,
                pagination: result.pagination
            });
        } catch (error) {
            console.error('Get users by department error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get user statistics (public)
    static async getUserStats(req, res) {
        try {
            const result = await User.getStats();
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get user statistics',
                    error: result.error
                });
            }

            res.json({
                success: true,
                data: result.data
            });
        } catch (error) {
            console.error('Get user stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get current user's connections (users in same department)
    static async getConnections(req, res) {
        try {
            const currentUserId = req.user.id;
            const currentUser = req.user;

            if (!currentUser.department) {
                return res.json({
                    success: true,
                    data: [],
                    message: 'No department assigned'
                });
            }

            const result = await User.findByDepartment(currentUser.department, 1, 50);
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to get connections',
                    error: result.error
                });
            }

            // Filter out current user and remove sensitive information
            const connections = result.data
                .filter(user => user.id !== currentUserId)
                .map(user => ({
                    id: user.id,
                    name: user.name,
                    role: user.role,
                    department: user.department,
                    profile_picture: user.profile_picture,
                    bio: user.bio,
                    created_at: user.created_at
                }));

            res.json({
                success: true,
                data: connections,
                pagination: {
                    total: connections.length,
                    page: 1,
                    limit: 50
                }
            });
        } catch (error) {
            console.error('Get connections error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Follow/Unfollow user (if implementing social features)
    static async toggleFollow(req, res) {
        try {
            const { targetUserId } = req.params;
            const currentUserId = req.user.id;

            if (currentUserId === parseInt(targetUserId)) {
                return res.status(400).json({
                    success: false,
                    message: 'Cannot follow yourself'
                });
            }

            // Check if target user exists
            const targetUserResult = await User.findById(targetUserId);
            if (!targetUserResult.success) {
                return res.status(404).json({
                    success: false,
                    message: 'Target user not found'
                });
            }

            // In a real application, you'd have a follows table
            // For now, we'll return a placeholder response
            res.json({
                success: true,
                message: 'Follow functionality not implemented yet',
                data: {
                    following: true,
                    targetUserId: parseInt(targetUserId)
                }
            });
        } catch (error) {
            console.error('Toggle follow error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Get user activity (posts, events, etc.)
    static async getUserActivity(req, res) {
        try {
            const { id } = req.params;
            const { page = 1, limit = 10 } = req.query;

            // Check if user exists
            const userResult = await User.findById(id);
            if (!userResult.success) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found'
                });
            }

            // In a real application, you'd fetch user activity from various tables
            // For now, we'll return a placeholder response
            res.json({
                success: true,
                message: 'User activity functionality not implemented yet',
                data: {
                    userId: parseInt(id),
                    activities: [],
                    pagination: {
                        page: parseInt(page),
                        limit: parseInt(limit),
                        total: 0,
                        totalPages: 0
                    }
                }
            });
        } catch (error) {
            console.error('Get user activity error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }

    // Update user status (online/offline)
    static async updateStatus(req, res) {
        try {
            const currentUserId = req.user.id;
            const { status } = req.body;

            const validStatuses = ['online', 'offline', 'away', 'busy'];
            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    success: false,
                    message: 'Invalid status. Must be online, offline, away, or busy'
                });
            }

            // Update user status
            const result = await User.update(currentUserId, { status });
            if (!result.success) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to update status',
                    error: result.error
                });
            }

            // Emit status change to connected users
            // emitToUser(req.io, currentUserId, 'status_changed', { status });

            res.json({
                success: true,
                message: 'Status updated successfully',
                data: { status }
            });
        } catch (error) {
            console.error('Update status error:', error);
            res.status(500).json({
                success: false,
                message: 'Internal server error',
                error: error.message
            });
        }
    }
}

module.exports = UserController;
