const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const AdminForumController = require('../../controllers/admin/adminForumController');

// Forum management routes
router.get('/', authenticateToken, requireAdmin, AdminForumController.getAllForums);
router.get('/:id', authenticateToken, requireAdmin, AdminForumController.getForumById);
router.put('/:id', authenticateToken, requireAdmin, AdminForumController.updateForum);
router.delete('/:id', authenticateToken, requireAdmin, AdminForumController.deleteForum);
router.get('/:forumId/posts', authenticateToken, requireAdmin, AdminForumController.getForumPostsByForum);
router.get('/posts/:postId', authenticateToken, requireAdmin, AdminForumController.getForumPostById);
router.put('/posts/:postId', authenticateToken, requireAdmin, AdminForumController.updateForumPost);
router.delete('/posts/:postId', authenticateToken, requireAdmin, AdminForumController.deleteForumPost);

module.exports = router;
