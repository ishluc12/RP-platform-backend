const express = require('express');
const router = express.Router();

const UserController = require('../../controllers/shared/userController');
const { authenticateToken } = require('../../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// ---- Static routes first ----

// Search users
router.get('/search', UserController.searchUsers);

// Update current user's profile
router.put('/profile', UserController.updateUserProfile);

// Get users by role
router.get('/role/:role', UserController.getUsersByRole);

// Get users by department
router.get('/department/:department', UserController.getUsersByDepartment);

// Get user statistics (public)
router.get('/stats/overview', UserController.getUserStats);

// Get current user's connections
router.get('/connections', UserController.getConnections);

// Update current user's status
router.put('/status', UserController.updateStatus);

// ---- Dynamic routes last ----

// Get user by ID (public profile)
router.get('/:id', UserController.getUserById);

// Get user activity
router.get('/:id/activity', UserController.getUserActivity);

// Follow/Unfollow another user
router.post('/:targetUserId/follow', UserController.toggleFollow);

module.exports = router;
