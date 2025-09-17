const router = require('express').Router();
const { authenticateToken } = require('../../middleware/auth');
const MessageController = require('../../controllers/shared/messageController');

// Protected routes (authentication required for all message/chat group operations)
router.use(authenticateToken);

// --- Message Routes ---
// Send a new message (to user or group)
router.post('/', MessageController.sendMessage);

// Get direct message thread with another user
router.get('/thread/:otherId', MessageController.getDirectMessageThread);

// Get messages for a specific group chat
router.get('/group/:groupId', MessageController.getGroupMessages);

// Get user's direct conversations (list of users they have messaged)
router.get('/conversations', MessageController.getUserConversations);

// Get user's group chats
router.get('/groups', MessageController.getUserGroupChats);

// No chat group routes in this file, they belong in chatGroups.js

module.exports = router;