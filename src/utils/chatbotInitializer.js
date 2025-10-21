const EnhancedChatbotTrainingService = require('../services/chatbotTrainingService');
const { logger } = require('./logger');
const fs = require('fs').promises;
const path = require('path');

/**
 * Chatbot Initializer - Handles initialization and training of the chatbot system
 */
class ChatbotInitializer {
    /**
     * Initialize the chatbot system with comprehensive training
     */
    static async initialize() {
        try {
            logger.info('Initializing chatbot system...');
            
            // Create data directory if it doesn't exist
            const dataDir = path.join(__dirname, '../data');
            
            try {
                await fs.mkdir(dataDir, { recursive: true });
                logger.info('Data directory verified/created');
            } catch (err) {
                if (err.code !== 'EEXIST') {
                    logger.error('Error creating data directory:', err);
                    throw err;
                }
            }
            
            // Check if model exists, if not initialize with comprehensive training
            const modelPath = path.join(dataDir, 'chatbot_model.json');
            let modelExists = false;
            
            try {
                await fs.access(modelPath);
                modelExists = true;
                logger.info('Existing chatbot model found');
            } catch (err) {
                logger.info('No existing model found, will create new one');
            }
            
            if (!modelExists) {
                // Initialize with comprehensive training
                logger.info('Starting comprehensive chatbot training...');
                await EnhancedChatbotTrainingService.initializeWithComprehensiveTraining();
                logger.info('Comprehensive training completed');
            } else {
                // Load existing model
                try {
                    await EnhancedChatbotTrainingService.loadModel();
                    logger.info('Existing chatbot model loaded successfully');
                } catch (err) {
                    logger.warn('Failed to load existing model, retraining...', err);
                    await EnhancedChatbotTrainingService.initializeWithComprehensiveTraining();
                }
            }
            
            logger.info('✅ Chatbot system initialized successfully');
            return true;
        } catch (error) {
            logger.error('❌ Failed to initialize chatbot system:', error);
            return false;
        }
    }
    
    /**
     * Update training data periodically
     */
    static async updateTraining() {
        try {
            logger.info('Updating chatbot training...');
            await EnhancedChatbotTrainingService.trainModel();
            logger.info('✅ Chatbot training updated successfully');
            return true;
        } catch (error) {
            logger.error('❌ Failed to update chatbot training:', error);
            return false;
        }
    }
    
    /**
     * Retrain the model with fresh data
     */
    static async retrain() {
        try {
            logger.info('Retraining chatbot model...');
            await EnhancedChatbotTrainingService.initializeWithComprehensiveTraining();
            logger.info('✅ Chatbot model retrained successfully');
            return true;
        } catch (error) {
            logger.error('❌ Failed to retrain chatbot model:', error);
            return false;
        }
    }
    
    /**
     * Check chatbot system health
     */
    static async healthCheck() {
        try {
            const isModelTrained = EnhancedChatbotTrainingService.isModelTrained;
            const dataDir = path.join(__dirname, '../data');
            const modelPath = path.join(dataDir, 'chatbot_model.json');
            const trainingDataPath = path.join(dataDir, 'training_data.json');
            
            const checks = {
                modelTrained: isModelTrained,
                modelFileExists: false,
                trainingDataExists: false
            };
            
            try {
                await fs.access(modelPath);
                checks.modelFileExists = true;
            } catch (err) {
                // Model file doesn't exist
            }
            
            try {
                await fs.access(trainingDataPath);
                checks.trainingDataExists = true;
            } catch (err) {
                // Training data doesn't exist
            }
            
            const healthy = checks.modelTrained && checks.modelFileExists && checks.trainingDataExists;
            
            return {
                healthy,
                checks,
                message: healthy ? 'Chatbot system is healthy' : 'Chatbot system needs attention'
            };
        } catch (error) {
            logger.error('Error during chatbot health check:', error);
            return {
                healthy: false,
                error: error.message,
                message: 'Chatbot health check failed'
            };
        }
    }
}

module.exports = ChatbotInitializer;
