const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const postController = require('../../controllers/shared/postController');

router.use(authenticateToken);

// Create post
router.post('/', postController.createPost);

// Get paginated feed of posts
router.get('/', postController.getFeed);

// Get a single post by ID
router.get('/:id', postController.getPostById);

// Update a post
router.put('/:id', postController.updatePost);

// Delete a post
router.delete('/:id', postController.deletePost);

// Like post
router.post('/:postId/like', postController.likePost);

// Unlike post
router.delete('/:postId/unlike', postController.unlikePost);

// List likes for a post
router.get('/:postId/likes', postController.getLikes);

module.exports = router;
