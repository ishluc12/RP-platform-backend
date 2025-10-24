const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const AdminPostController = require('../../controllers/admin/adminPostController');

// Post management routes for admin
router.get('/', authenticateToken, requireAdmin, AdminPostController.getAllPosts);
router.delete('/:id', authenticateToken, requireAdmin, AdminPostController.deletePost);
router.put('/:id/block', authenticateToken, requireAdmin, AdminPostController.blockPost);
router.put('/:id/unblock', authenticateToken, requireAdmin, AdminPostController.unblockPost);
router.put('/:id/flag', authenticateToken, requireAdmin, AdminPostController.flagPost);

// User ban/unban routes
router.put('/users/:id/ban', authenticateToken, requireAdmin, AdminPostController.banUser);
router.put('/users/:id/unban', authenticateToken, requireAdmin, AdminPostController.unbanUser);

module.exports = router;
