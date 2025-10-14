const express = require('express');
const router = express.Router();
const chatbotController = require('../../controllers/shared/chatbotController');
const { authenticate } = require('../../middleware/auth');

// All chatbot routes require authentication
router.use(authenticate);

/**
 * @route   POST /api/shared/chatbot/query
 * @desc    Process a chatbot query
 * @access  Private (All authenticated users)
 */
router.post('/query', chatbotController.handleQuery);

module.exports = router;
