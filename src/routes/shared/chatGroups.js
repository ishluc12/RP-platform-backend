const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const chatGroupController = require('../../controllers/shared/chatGroupController');

router.use(authenticateToken);

// --- Chat Group Routes ---

// Create a new chat group
router.post('/', chatGroupController.createChatGroup);

// Get a chat group by ID
router.get('/:id', chatGroupController.getChatGroupById);

// Update a chat group
router.put('/:id', chatGroupController.updateChatGroup);

// Delete a chat group
router.delete('/:id', chatGroupController.deleteChatGroup);

// --- Chat Group Member Routes ---

// Add a member to a chat group
router.post('/:groupId/members', chatGroupController.addGroupMember);

// Remove a member from a chat group
router.delete('/:groupId/members/:userId', chatGroupController.removeGroupMember);

module.exports = router;
