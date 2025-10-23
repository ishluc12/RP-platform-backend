const intelligentChatbotService = require('../../services/intelligentChatbotService');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

/**
 * Handle chatbot query with intelligent service
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const handleQuery = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user.id;
        const userName = req.user.name || 'User';
        const userRole = req.user.role;

        if (!message || !message.trim()) {
            return errorResponse(res, 400, 'Message is required');
        }

        logger.info(`Intelligent chatbot query from user ${userId} (${userRole}): ${message}`);

        const result = await intelligentChatbotService.processQuery(userId, message, userName, userRole);

        if (!result.success) {
            return errorResponse(res, 500, result.message || 'Failed to process query', result.error);
        }

        response(res, 200, 'Query processed successfully', result);
    } catch (error) {
        logger.error('Error in chatbot controller:', error);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

module.exports = {
    handleQuery
};
