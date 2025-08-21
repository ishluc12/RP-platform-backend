const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const Notifications = require('../../models/Notification');

router.use(authenticateToken);

// List notifications
router.get('/', async (req, res) => {
    const { page = 1, limit = 20 } = req.query;
    const result = await Notifications.listForUser(req.user.id, { page: parseInt(page), limit: parseInt(limit) });
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, data: result.data });
});

// Mark read
router.put('/:id/read', async (req, res) => {
    const id = parseInt(req.params.id);
    const result = await Notifications.markRead(id, req.user.id);
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, data: result.data });
});

module.exports = router;
