const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const Post = require('../../models/Post');

router.use(authenticateToken);

// Create post
router.post('/', async (req, res) => {
    try {
        const user_id = req.user.id;
        const { content, image_url } = req.body;
        const result = await Post.create({ user_id, content, image_url });
        if (!result.success) return res.status(400).json({ success: false, message: result.error });
        res.status(201).json({ success: true, data: result.data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
});

// Feed
router.get('/', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const result = await Post.feed({ page: parseInt(page), limit: parseInt(limit) });
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, data: result.data });
});

// Like post
router.post('/:post_id/like', async (req, res) => {
    const post_id = parseInt(req.params.post_id);
    const user_id = req.user.id;
    const result = await Post.like({ post_id, user_id });
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, data: result.data });
});

module.exports = router;
