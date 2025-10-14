const express = require('express');
const router = express.Router();
const ChatbotTrainingController = require('../../controllers/chatbotTrainingController');
const { authenticate, authorize } = require('../../middleware/auth');

// All routes require authentication and admin authorization
router.use(authenticate);
router.use(authorize(['administrator']));

/**
 * @route   POST /api/admin/chatbot/train
 * @desc    Train the chatbot with provided data
 * @access  Private (Admin only)
 */
router.post('/train', ChatbotTrainingController.trainChatbot);

/**
 * @route   POST /api/admin/chatbot/generate-system-training
 * @desc    Generate and apply system training data
 * @access  Private (Admin only)
 */
router.post('/generate-system-training', ChatbotTrainingController.generateSystemTrainingData);

/**
 * @route   POST /api/admin/chatbot/test
 * @desc    Test the chatbot with a sample query
 * @access  Private (Admin only)
 */
router.post('/test', ChatbotTrainingController.testChatbot);

module.exports = router;