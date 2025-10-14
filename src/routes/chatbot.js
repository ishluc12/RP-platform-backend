const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const ChatbotController = require('../controllers/chatbotController');

// All chatbot routes require authentication
router.use(authenticateToken);

/**
 * POST /api/chatbot/query
 * Main chatbot query endpoint
 * Body: { message: string, queryType?: string }
 */
router.post('/query', ChatbotController.query);

module.exports = router;
