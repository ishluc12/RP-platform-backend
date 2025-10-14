const { logger } = require('../utils/logger');
const natural = require('natural');
const { WordTokenizer, PorterStemmer, BayesClassifier } = natural;
const fs = require('fs').promises;
const path = require('path');

/**
 * ChatbotTrainingService - Handles ML-based training for the chatbot
 * Uses natural.js for NLP capabilities including:
 * - Intent classification with Naive Bayes
 * - Tokenization and stemming for text preprocessing
 * - TF-IDF for feature extraction
 */
class ChatbotTrainingService {
  constructor() {
    this.classifier = new BayesClassifier();
    this.tokenizer = new WordTokenizer();
    this.modelPath = path.join(__dirname, '../../data/chatbot_model.json');
    this.trainingDataPath = path.join(__dirname, '../../data/training_data.json');
    this.isModelTrained = false;
  }

  /**
   * Initialize the training service
   */
  async initialize() {
    try {
      // Create data directory if it doesn't exist
      const dataDir = path.join(__dirname, '../../data');
      try {
        await fs.mkdir(dataDir, { recursive: true });
      } catch (err) {
        if (err.code !== 'EEXIST') throw err;
      }

      // Try to load existing model
      try {
        await this.loadModel();
        logger.info('Chatbot model loaded successfully');
      } catch (err) {
        logger.info('No existing model found, will train new model when data is available');
      }

      return true;
    } catch (error) {
      logger.error('Error initializing chatbot training service:', error);
      return false;
    }
  }

  /**
   * Add training data from various sources
   * @param {Object} data - Training data object with intents and examples
   */
  async addTrainingData(data) {
    try {
      let trainingData = {};
      
      // Try to load existing training data
      try {
        const existingData = await fs.readFile(this.trainingDataPath, 'utf8');
        trainingData = JSON.parse(existingData);
      } catch (err) {
        trainingData = { intents: {} };
      }

      // Merge new data with existing data
      if (data.intents) {
        Object.keys(data.intents).forEach(intent => {
          if (!trainingData.intents[intent]) {
            trainingData.intents[intent] = {
              examples: []
            };
          }
          
          // Add new examples
          if (data.intents[intent].examples) {
            trainingData.intents[intent].examples = [
              ...new Set([
                ...trainingData.intents[intent].examples,
                ...data.intents[intent].examples
              ])
            ];
          }
          
          // Add keywords if they exist
          if (data.intents[intent].keywords) {
            trainingData.intents[intent].keywords = [
              ...new Set([
                ...(trainingData.intents[intent].keywords || []),
                ...data.intents[intent].keywords
              ])
            ];
          }
        });
      }

      // Save updated training data
      await fs.writeFile(this.trainingDataPath, JSON.stringify(trainingData, null, 2));
      logger.info('Training data updated successfully');
      
      // Mark model as needing retraining
      this.isModelTrained = false;
      
      return true;
    } catch (error) {
      logger.error('Error adding training data:', error);
      return false;
    }
  }

  /**
   * Train the model using the collected training data
   */
  async trainModel() {
    try {
      // Load training data
      const data = await fs.readFile(this.trainingDataPath, 'utf8');
      const trainingData = JSON.parse(data);
      
      // Reset classifier
      this.classifier = new BayesClassifier();
      
      // Add examples for each intent
      Object.keys(trainingData.intents).forEach(intent => {
        const examples = trainingData.intents[intent].examples || [];
        examples.forEach(example => {
          this.classifier.addDocument(this.preprocessText(example), intent);
        });
        
        // Also add keywords as strong signals
        const keywords = trainingData.intents[intent].keywords || [];
        keywords.forEach(keyword => {
          // Add each keyword multiple times to increase its weight
          for (let i = 0; i < 3; i++) {
            this.classifier.addDocument(this.preprocessText(keyword), intent);
          }
        });
      });
      
      // Train the classifier
      this.classifier.train();
      
      // Save the trained model
      await this.saveModel();
      
      this.isModelTrained = true;
      logger.info('Chatbot model trained successfully');
      
      return true;
    } catch (error) {
      logger.error('Error training chatbot model:', error);
      return false;
    }
  }

  /**
   * Preprocess text for better classification
   * @param {string} text - Input text
   * @returns {string} - Preprocessed text
   */
  preprocessText(text) {
    // Convert to lowercase
    const lowercased = text.toLowerCase();
    
    // Tokenize
    const tokens = this.tokenizer.tokenize(lowercased);
    
    // Remove stopwords and stem
    const processed = tokens
      .filter(token => !this.isStopword(token))
      .map(token => PorterStemmer.stem(token));
    
    return processed.join(' ');
  }

  /**
   * Check if a word is a stopword
   * @param {string} word - Word to check
   * @returns {boolean} - True if stopword
   */
  isStopword(word) {
    const stopwords = ['a', 'an', 'the', 'and', 'or', 'but', 'is', 'are', 'was', 'were', 
                      'be', 'been', 'being', 'in', 'on', 'at', 'to', 'for', 'with', 
                      'by', 'about', 'against', 'between', 'into', 'through', 'during', 
                      'before', 'after', 'above', 'below', 'from', 'up', 'down', 'of', 'off', 'over'];
    return stopwords.includes(word);
  }

  /**
   * Classify user input to determine intent
   * @param {string} text - User input
   * @returns {Object} - Classification result with intent and confidence
   */
  classifyText(text) {
    if (!this.isModelTrained) {
      return { intent: 'unknown', confidence: 0 };
    }
    
    const preprocessed = this.preprocessText(text);
    const classifications = this.classifier.getClassifications(preprocessed);
    
    if (classifications.length === 0) {
      return { intent: 'unknown', confidence: 0 };
    }
    
    return {
      intent: classifications[0].label,
      confidence: classifications[0].value,
      allClassifications: classifications
    };
  }

  /**
   * Save the trained model to disk
   */
  async saveModel() {
    try {
      const modelJson = this.classifier.toJson();
      await fs.writeFile(this.modelPath, modelJson);
      logger.info('Chatbot model saved successfully');
      return true;
    } catch (error) {
      logger.error('Error saving chatbot model:', error);
      return false;
    }
  }

  /**
   * Load a trained model from disk
   */
  async loadModel() {
    try {
      const modelJson = await fs.readFile(this.modelPath, 'utf8');
      this.classifier = BayesClassifier.restore(JSON.parse(modelJson));
      this.isModelTrained = true;
      logger.info('Chatbot model loaded successfully');
      return true;
    } catch (error) {
      logger.error('Error loading chatbot model:', error);
      throw error;
    }
  }

  /**
   * Generate training data from system information
   * @param {Object} systemInfo - System information object
   * @returns {Object} - Training data object
   */
  generateSystemTrainingData(systemInfo) {
    const trainingData = { intents: {} };
    
    // Add system features as intents
    if (systemInfo.features) {
      systemInfo.features.forEach(feature => {
        const intentName = feature.name.toLowerCase().replace(/\s+/g, '_');
        
        trainingData.intents[intentName] = {
          examples: [
            `Tell me about ${feature.name}`,
            `How does ${feature.name} work`,
            `What is ${feature.name}`,
            `${feature.name} information`,
            `Help with ${feature.name}`,
            `${feature.name} help`,
            `${feature.name} guide`,
            `${feature.name} tutorial`,
            `${feature.name} instructions`
          ],
          keywords: [
            feature.name,
            ...feature.keywords || []
          ]
        };
      });
    }
    
    // Add role-specific intents
    if (systemInfo.roles) {
      Object.keys(systemInfo.roles).forEach(role => {
        const roleInfo = systemInfo.roles[role];
        
        trainingData.intents[`${role}_info`] = {
          examples: [
            `What can ${role}s do`,
            `${role} permissions`,
            `${role} capabilities`,
            `What are ${role} features`,
            `Tell me about ${role}s`
          ],
          keywords: [
            role,
            'permissions',
            'capabilities',
            'features'
          ]
        };
      });
    }
    
    return trainingData;
  }
}

module.exports = new ChatbotTrainingService();