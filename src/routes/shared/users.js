const express = require('express');
const router = express.Router();

const UserController = require('../../controllers/shared/userController');
const { authenticateToken } = require('../../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get user by ID (public profile)
router.get('/:id', UserController.getUserById);

// Search users
router.get('/search', UserController.searchUsers);

// Get users by role
router.get('/role/:role', UserController.getUsersByRole);

// Get users by department
router.get('/department/:department', UserController.getUsersByDepartment);

// Get user statistics (public)
router.get('/stats/overview', UserController.getUserStats);

// Get current user's connections
router.get('/connections', UserController.getConnections);

// Follow/Unfollow user (if implementing social features)
router.post('/:targetUserId/follow', UserController.toggleFollow);

// Get user activity
router.get('/:id/activity', UserController.getUserActivity);

// Update user status
router.put('/status', UserController.updateStatus);

module.exports = router;
