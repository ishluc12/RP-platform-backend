const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const commentController = require('../../controllers/shared/commentController');

router.use(authenticateToken);

// Create a new comment on a post
router.post('/post/:postId', commentController.createComment);

// Get comments for a specific post
router.get('/post/:postId', commentController.getCommentsByPost);

// Delete a comment
router.delete('/:commentId', commentController.deleteComment);

module.exports = router;
