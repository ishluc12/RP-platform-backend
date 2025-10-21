const EnhancedChatbotService = require('../services/enhancedChatbotService');
const { response, errorResponse } = require('../utils/responseHandlers');
const { logger } = require('../utils/logger');

/**
 * Enhanced Chatbot Controller - Main entry point for chatbot queries
 * Handles all chatbot interactions with intelligent routing
 */
class EnhancedChatbotController {
    /**
     * Main query handler
     * POST /api/chatbot/query
     */
    static async query(req, res) {
        try {
            const { message, context = {} } = req.body;
            const user = req.user;
            
            if (!message || !message.trim()) {
                return errorResponse(res, 400, 'Message is required');
            }
            
            logger.info(`Chatbot query from user ${user.id} (${user.role}): ${message}`);
            
            // Process query with enhanced service
            const result = await EnhancedChatbotService.processQuery(
                user.id,
                message,
                user.name || 'User',
                user.role
            );
            
            if (!result.success && result.error) {
                return errorResponse(res, 500, result.message || 'Failed to process query', result.error);
            }
            
            response(res, 200, 'Query processed successfully', result);
        } catch (error) {
            logger.error('Enhanced chatbot controller error:', error);
            errorResponse(res, 500, 'Failed to process chatbot query', error.message);
        }
    }
    
    /**
     * Get suggestions based on user role
     * GET /api/chatbot/suggestions
     */
    static getSuggestionsForRole(req, res) {
        try {
            const userRole = req.user.role;
            
            const suggestions = {
                student: [
                    'Book appointment',
                    'View my appointments',
                    'Check lecturer availability',
                    'Upcoming events',
                    'Help'
                ],
                lecturer: [
                    'View appointment requests',
                    'Set my availability',
                    'Create event',
                    'My schedule today',
                    'Help'
                ],
                administrator: [
                    'System dashboard',
                    'Manage appointments',
                    'Create event',
                    'View reports',
                    'User management'
                ]
            };
            
            response(res, 200, 'Suggestions retrieved', {
                suggestions: suggestions[userRole] || suggestions.student
            });
        } catch (error) {
            logger.error('Error getting suggestions:', error);
            errorResponse(res, 500, 'Failed to get suggestions', error.message);
        }
    }
    
    /**
     * Get chatbot health status
     * GET /api/chatbot/health
     */
    static async getHealth(req, res) {
        try {
            const ChatbotInitializer = require('../utils/chatbotInitializer');
            const healthStatus = await ChatbotInitializer.healthCheck();
            
            response(res, 200, healthStatus.message, healthStatus);
        } catch (error) {
            logger.error('Error checking chatbot health:', error);
            errorResponse(res, 500, 'Failed to check chatbot health', error.message);
        }
    }
}

module.exports = EnhancedChatbotController;
