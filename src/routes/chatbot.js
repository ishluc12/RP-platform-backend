const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const EnhancedChatbotController = require('../controllers/enhancedChatbotController');
const ChatbotController = require('../controllers/chatbotController');

// All chatbot routes require authentication
router.use(authenticateToken);

/**
 * POST /api/chatbot/query
 * Main enhanced chatbot query endpoint with NLP
 * Body: { message: string, context?: object }
 */
router.post('/query', EnhancedChatbotController.query);

/**
 * POST /api/chatbot/simple-query
 * Simple chatbot query endpoint (legacy support)
 * Body: { message: string, queryType?: string }
 */
router.post('/simple-query', ChatbotController.query);

/**
 * GET /api/chatbot/suggestions
 * Get role-based suggestions
 */
router.get('/suggestions', EnhancedChatbotController.getSuggestionsForRole);

/**
 * GET /api/chatbot/health
 * Check chatbot system health
 */
router.get('/health', EnhancedChatbotController.getHealth);

module.exports = router;
