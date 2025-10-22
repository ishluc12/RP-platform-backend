const router = require('express').Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireSysAdmin } = require('../../middleware/roleAuth');
const feedManagementController = require('../../controllers/admin/feedManagementController');

// Apply authentication and sys-admin role check to all routes
router.use(authenticateToken);
router.use(requireSysAdmin);

// Get all posts for moderation
router.get('/posts', feedManagementController.getAllPostsForModeration);

// Get flagged posts
router.get('/posts/flagged', feedManagementController.getFlaggedPosts);

// Get moderation statistics
router.get('/stats', feedManagementController.getModerationStats);

// Moderate a specific post
router.put('/posts/:postId/moderate', feedManagementController.moderatePost);

// Bulk moderate posts
router.put('/posts/bulk-moderate', feedManagementController.bulkModerate);

// Get user's post history
router.get('/users/:userId/posts', feedManagementController.getUserPostHistory);

module.exports = router;