const EnhancedChatbotService = require('../services/enhancedChatbotService');
const IntelligentChatbotService = require('../services/intelligentChatbotService');
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
            
            // Process query with intelligent service first, fallback to enhanced service
            let result;
            try {
                result = await IntelligentChatbotService.processQuery(
                    user.id,
                    message,
                    user.name || 'User',
                    user.role
                );
                
                // If intelligent service doesn't provide a good response, fallback to enhanced service
                if (!result.success || result.confidence < 0.4) {
                    logger.info('Falling back to enhanced chatbot service');
                    result = await EnhancedChatbotService.processQuery(
                        user.id,
                        message,
                        user.name || 'User',
                        user.role
                    );
                }
            } catch (error) {
                logger.warn('Intelligent service failed, using enhanced service:', error.message);
                result = await EnhancedChatbotService.processQuery(
                    user.id,
                    message,
                    user.name || 'User',
                    user.role
                );
            }
            
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
     * Handle notification click navigation
     * POST /api/chatbot/notification-click
     */
    static async handleNotificationClick(req, res) {
        try {
            const { notificationData, context = {} } = req.body;
            const user = req.user;
            
            if (!notificationData) {
                return errorResponse(res, 400, 'Notification data is required');
            }
            
            logger.info(`Notification click from user ${user.id} (${user.role}): ${notificationData.type}`);
            
            // Use intelligent service to handle notification navigation
            const result = await IntelligentChatbotService.handleNotificationNavigation(
                notificationData,
                user.id,
                user.role
            );
            
            if (!result) {
                return errorResponse(res, 500, 'Failed to process notification click');
            }
            
            response(res, 200, 'Notification click processed successfully', {
                success: true,
                message: result.message,
                navigationLink: result.navigationLink,
                quickActions: result.quickActions,
                suggestions: result.suggestions,
                interactive: result.interactive,
                notificationHandled: result.notificationHandled
            });
        } catch (error) {
            logger.error('Notification click handler error:', error);
            errorResponse(res, 500, 'Failed to process notification click', error.message);
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
