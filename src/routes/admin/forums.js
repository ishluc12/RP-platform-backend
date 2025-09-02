const express = require('express');
const router = express.Router();
const AdminForumController = require('../../controllers/admin/adminForumController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleAuth');

router.use(authenticateToken);
router.use(requireRole(['admin', 'sys_admin']));

// --- Admin Forum Routes ---

// Get all forums
router.get('/', AdminForumController.getAllForums);

// Get a specific forum by ID
router.get('/:id', AdminForumController.getForumById);

// Update a forum
router.put('/:id', AdminForumController.updateForum);

// Delete a forum
router.delete('/:id', AdminForumController.deleteForum);

// --- Admin Forum Post Routes ---

// Get all posts for a specific forum
router.get('/:forumId/posts', AdminForumController.getForumPostsByForum);

// Get a specific forum post by ID
router.get('/posts/:postId', AdminForumController.getForumPostById);

// Update a forum post
router.put('/posts/:postId', AdminForumController.updateForumPost);

// Delete a forum post
router.delete('/posts/:postId', AdminForumController.deleteForumPost);

module.exports = router;
