const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const ChatGroupController = require('../../controllers/shared/chatGroupController');

// Protected routes (authentication required for all chat group operations)
router.use(authenticateToken);

// --- Chat Group Routes ---
// Create a new chat group
router.post('/', ChatGroupController.createChatGroup);

// Get a chat group by ID
router.get('/:id', ChatGroupController.getChatGroupById);

// Update a chat group's details
router.put('/:id', ChatGroupController.updateChatGroup);

// Delete a chat group
router.delete('/:id', ChatGroupController.deleteChatGroup);

// Get all members of a chat group
router.get('/:groupId/members', ChatGroupController.getGroupMembers);

// Add a member to a chat group
router.post('/:groupId/members', ChatGroupController.addGroupMember);

// Remove a member from a chat group
router.delete('/:groupId/members/:userId', ChatGroupController.removeGroupMember);

module.exports = router;