const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const AdminPostController = require('../../controllers/admin/adminPostController');

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Get all posts for moderation
router.get('/', AdminPostController.getAllPosts);

// Delete a post
router.delete('/:id', AdminPostController.deletePost);

// Block a post
router.put('/:id/block', AdminPostController.blockPost);

// Unblock a post
router.put('/:id/unblock', AdminPostController.unblockPost);

// Flag a post
router.put('/:id/flag', AdminPostController.flagPost);

module.exports = router;