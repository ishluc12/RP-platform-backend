const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const forumController = require('../../controllers/shared/forumController');

router.use(authenticateToken);

// --- Forum Routes ---

// Create a new forum
router.post('/', forumController.createForum);

// Get all forums
router.get('/', forumController.getAllForums);

// Get a specific forum by ID
router.get('/:id', forumController.getForumById);

// Update a forum
router.put('/:id', forumController.updateForum);

// Delete a forum
router.delete('/:id', forumController.deleteForum);

// --- Forum Post Routes ---

// Create a new post in a forum
router.post('/:forumId/posts', forumController.createForumPost);

// Get posts for a specific forum
router.get('/:forumId/posts', forumController.getForumPostsByForum);

// Get a specific forum post by ID
router.get('/posts/:postId', forumController.getForumPostById);

// Update a forum post
router.put('/posts/:postId', forumController.updateForumPost);

// Delete a forum post
router.delete('/posts/:postId', forumController.deleteForumPost);

module.exports = router;
