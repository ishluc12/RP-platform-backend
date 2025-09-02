const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const pollController = require('../../controllers/shared/pollController');

router.use(authenticateToken);

// Create a new poll
router.post('/', pollController.createPoll);

// Get all polls
router.get('/', pollController.getAllPolls);

// Get a specific poll by ID
router.get('/:id', pollController.getPollById);

// Vote on a poll
router.post('/vote', pollController.voteOnPoll);

module.exports = router;
