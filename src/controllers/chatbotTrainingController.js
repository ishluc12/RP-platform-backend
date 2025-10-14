const chatbotTrainingService = require('../services/chatbotTrainingService');
const { response, errorResponse } = require('../utils/responseHandlers');
const { logger } = require('../utils/logger');

/**
 * Controller for chatbot training operations
 */
class ChatbotTrainingController {
  /**
   * Train the chatbot with provided data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async trainChatbot(req, res) {
    try {
      const { trainingData } = req.body;
      
      if (!trainingData || !trainingData.intents) {
        return errorResponse(res, 400, 'Valid training data is required');
      }
      
      // Add the training data
      const addResult = await chatbotTrainingService.addTrainingData(trainingData);
      
      if (!addResult) {
        return errorResponse(res, 500, 'Failed to add training data');
      }
      
      // Train the model
      const trainResult = await chatbotTrainingService.trainModel();
      
      if (!trainResult) {
        return errorResponse(res, 500, 'Failed to train model');
      }
      
      response(res, 200, 'Chatbot trained successfully', { success: true });
    } catch (error) {
      logger.error('Error in chatbot training controller:', error);
      errorResponse(res, 500, 'Internal server error', error.message);
    }
  }
  
  /**
   * Generate system training data
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async generateSystemTrainingData(req, res) {
    try {
      const { systemInfo } = req.body;
      
      if (!systemInfo) {
        return errorResponse(res, 400, 'System information is required');
      }
      
      const trainingData = chatbotTrainingService.generateSystemTrainingData(systemInfo);
      
      // Add the generated training data
      const addResult = await chatbotTrainingService.addTrainingData(trainingData);
      
      if (!addResult) {
        return errorResponse(res, 500, 'Failed to add system training data');
      }
      
      // Train the model
      const trainResult = await chatbotTrainingService.trainModel();
      
      if (!trainResult) {
        return errorResponse(res, 500, 'Failed to train model with system data');
      }
      
      response(res, 200, 'System training data generated and applied', { success: true });
    } catch (error) {
      logger.error('Error generating system training data:', error);
      errorResponse(res, 500, 'Internal server error', error.message);
    }
  }
  
  /**
   * Test the chatbot with a sample query
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  static async testChatbot(req, res) {
    try {
      const { query } = req.body;
      
      if (!query) {
        return errorResponse(res, 400, 'Query is required');
      }
      
      const classification = chatbotTrainingService.classifyText(query);
      
      response(res, 200, 'Query classified successfully', classification);
    } catch (error) {
      logger.error('Error testing chatbot:', error);
      errorResponse(res, 500, 'Internal server error', error.message);
    }
  }
}

module.exports = ChatbotTrainingController;