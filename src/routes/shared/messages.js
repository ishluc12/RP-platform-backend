const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const Message = require('../../models/Message');
const messageController = require('../../controllers/shared/messageController');

router.use(authenticateToken);

// Send message
router.post('/', async (req, res) => {
    const sender_id = req.user.id;
    const { receiver_id, message, is_group = false, group_id = null, message_type = 'text' } = req.body;
    const result = await Message.send({ sender_id, receiver_id, message, is_group, group_id, message_type });
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    res.status(201).json({ success: true, data: result.data });
});

// Get conversation thread with another user
router.get('/thread/:otherId', async (req, res) => {
    const userId = req.user.id;
    const otherId = parseInt(req.params.otherId);
    const { page = 1, limit = 20 } = req.query;
    const result = await Message.thread(userId, otherId, { page: parseInt(page), limit: parseInt(limit) });
    if (!result.success) return res.status(400).json({ success: false, message: result.error });
    res.json({ success: true, data: result.data });
});

// Get group chat messages
router.get('/group/:groupId', messageController.getGroupMessages);

// Get list of direct message conversations
router.get('/conversations', messageController.getUserConversations);

// Get list of group chats for the user
router.get('/groups', messageController.getUserGroupChats);

module.exports = router;
