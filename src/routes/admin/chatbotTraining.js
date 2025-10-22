const express = require('express');
const router = express.Router();
const EnhancedChatbotTrainingService = require('../../services/chatbotTrainingService');
const ChatbotInitializer = require('../../utils/chatbotInitializer');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');
const { authenticate, authorize } = require('../../middleware/auth');

// All routes require authentication and admin authorization
router.use(authenticate);
router.use(authorize(['administrator']));

/**
 * @route   POST /api/admin/chatbot/train
 * @desc    Train the chatbot with provided data
 * @access  Private (Admin only)
 */
router.post('/train', async (req, res) => {
    try {
        const { trainingData } = req.body;
        
        if (trainingData) {
            await EnhancedChatbotTrainingService.addTrainingData(trainingData);
        }
        
        const result = await EnhancedChatbotTrainingService.trainModel();
        
        if (result) {
            response(res, 200, 'Chatbot trained successfully', { trained: true });
        } else {
            errorResponse(res, 500, 'Failed to train chatbot');
        }
    } catch (error) {
        logger.error('Training error:', error);
        errorResponse(res, 500, 'Training failed', error.message);
    }
});

/**
 * @route   POST /api/admin/chatbot/retrain
 * @desc    Retrain the chatbot from scratch
 * @access  Private (Admin only)
 */
router.post('/retrain', async (req, res) => {
    try {
        const result = await ChatbotInitializer.retrain();
        
        if (result) {
            response(res, 200, 'Chatbot retrained successfully', { retrained: true });
        } else {
            errorResponse(res, 500, 'Failed to retrain chatbot');
        }
    } catch (error) {
        logger.error('Retraining error:', error);
        errorResponse(res, 500, 'Retraining failed', error.message);
    }
});

/**
 * @route   POST /api/admin/chatbot/test
 * @desc    Test the chatbot with a sample query
 * @access  Private (Admin only)
 */
router.post('/test', async (req, res) => {
    try {
        const { message, role = 'student' } = req.body;
        
        if (!message) {
            return errorResponse(res, 400, 'Message is required');
        }
        
        const classification = await EnhancedChatbotTrainingService.processQueryWithRole(
            message,
            role
        );
        
        response(res, 200, 'Test completed', {
            message,
            role,
            classification
        });
    } catch (error) {
        logger.error('Test error:', error);
        errorResponse(res, 500, 'Test failed', error.message);
    }
});

/**
 * @route   GET /api/admin/chatbot/status
 * @desc    Get chatbot system status
 * @access  Private (Admin only)
 */
router.get('/status', async (req, res) => {
    try {
        const healthStatus = await ChatbotInitializer.healthCheck();
        response(res, 200, 'Status retrieved', healthStatus);
    } catch (error) {
        logger.error('Status check error:', error);
        errorResponse(res, 500, 'Status check failed', error.message);
    }
});

/**
 * @route   POST /api/admin/chatbot/add-training
 * @desc    Add new training data
 * @access  Private (Admin only)
 */
router.post('/add-training', async (req, res) => {
    try {
        const { intents } = req.body;
        
        if (!intents) {
            return errorResponse(res, 400, 'Training data with intents is required');
        }
        
        const result = await EnhancedChatbotTrainingService.addTrainingData({ intents });
        
        if (result) {
            response(res, 200, 'Training data added successfully', { added: true });
        } else {
            errorResponse(res, 500, 'Failed to add training data');
        }
    } catch (error) {
        logger.error('Add training error:', error);
        errorResponse(res, 500, 'Failed to add training data', error.message);
    }
});

module.exports = router;