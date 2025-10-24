const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const adminPollController = require('../../controllers/admin/adminPollController');

// Apply authentication and admin role middleware to all routes
router.use(authenticateToken);
router.use(requireAdmin);

// Get all polls (admin view)
router.get('/', adminPollController.getAllPolls);

// Get a specific poll by ID (admin view)
router.get('/:id', adminPollController.getPollById);

// Create a new poll (admin only)
router.post('/', adminPollController.createPoll);

// Update a poll (admin only)
router.put('/:id', adminPollController.updatePoll);

// Delete a poll (admin only)
router.delete('/:id', adminPollController.deletePoll);

// Update poll status (activate/deactivate)
router.put('/:id/status', adminPollController.updatePollStatus);

module.exports = router;