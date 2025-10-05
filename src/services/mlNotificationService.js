/**
 * ML-based Notification Service
 * Provides intelligent notifications based on system monitoring and user behavior
 */
const { v4: uuidv4 } = require('uuid');
const winston = require('winston');

// Create a logger for the ML notification service
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'ml-notification-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/ml-notifications.log' }),
  ],
});

// Store notification patterns and user preferences
let notificationData = {
  patterns: {},
  userPreferences: {},
  notificationHistory: [],
  actionPatterns: {}
};

/**
 * Initialize a user's notification preferences
 * @param {String} userId - The user's ID
 * @param {Object} preferences - Initial preferences
 */
const initUserPreferences = (userId, preferences = {}) => {
  notificationData.userPreferences[userId] = {
    ...preferences,
    // Default preferences
    receiveSystemAlerts: true,
    receiveActivityNotifications: true,
    receiveAnomalyAlerts: true,
    quietHours: {
      enabled: false,
      start: 22, // 10 PM
      end: 8     // 8 AM
    },
    notificationFrequency: 'medium', // 'low', 'medium', 'high'
    lastNotified: 0
  };
  
  logger.info('User notification preferences initialized', { userId });
};

/**
 * Update a user's notification preferences
 * @param {String} userId - The user's ID
 * @param {Object} preferences - New preferences to merge
 */
const updateUserPreferences = (userId, preferences) => {
  if (!notificationData.userPreferences[userId]) {
    initUserPreferences(userId);
  }
  
  notificationData.userPreferences[userId] = {
    ...notificationData.userPreferences[userId],
    ...preferences
  };
  
  logger.info('User notification preferences updated', { userId, preferences });
};

/**
 * Learn from user actions to improve notification relevance
 * @param {String} userId - The user's ID
 * @param {String} action - The action performed
 * @param {Object} context - Additional context about the action
 */
const learnFromUserAction = (userId, action, context = {}) => {
  if (!notificationData.actionPatterns[userId]) {
    notificationData.actionPatterns[userId] = {};
  }
  
  if (!notificationData.actionPatterns[userId][action]) {
    notificationData.actionPatterns[userId][action] = {
      count: 0,
      contexts: [],
      timestamps: []
    };
  }
  
  const pattern = notificationData.actionPatterns[userId][action];
  pattern.count++;
  pattern.contexts.push(context);
  pattern.timestamps.push(Date.now());
  
  // Keep only the last 50 contexts and timestamps
  if (pattern.contexts.length > 50) {
    pattern.contexts.shift();
    pattern.timestamps.shift();
  }
  
  logger.info('Learned from user action', { userId, action, context });
  
  // Analyze patterns periodically
  if (pattern.count % 10 === 0) {
    analyzeUserActionPatterns(userId, action);
  }
};

/**
 * Analyze patterns in user actions to predict future behavior
 * @param {String} userId - The user's ID
 * @param {String} action - The action to analyze
 */
const analyzeUserActionPatterns = (userId, action) => {
  const pattern = notificationData.actionPatterns[userId][action];
  if (!pattern || pattern.timestamps.length < 5) return;
  
  // Analyze time patterns
  const timestamps = pattern.timestamps;
  const timeDiffs = [];
  
  for (let i = 1; i < timestamps.length; i++) {
    timeDiffs.push(timestamps[i] - timestamps[i-1]);
  }
  
  // Calculate average time between actions
  const avgTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
  
  // Calculate standard deviation
  const variance = timeDiffs.reduce((sum, diff) => sum + Math.pow(diff - avgTimeDiff, 2), 0) / timeDiffs.length;
  const stdDev = Math.sqrt(variance);
  
  // Store the pattern analysis
  notificationData.patterns[`${userId}-${action}`] = {
    avgTimeDiff,
    stdDev,
    predictedNext: Date.now() + avgTimeDiff,
    confidence: stdDev < avgTimeDiff ? 'high' : stdDev < avgTimeDiff * 2 ? 'medium' : 'low'
  };
  
  logger.info('User action pattern analyzed', { 
    userId, 
    action, 
    avgTimeDiff, 
    stdDev, 
    predictedNext: new Date(Date.now() + avgTimeDiff).toISOString() 
  });
};

/**
 * Create a notification based on system activity or anomaly
 * @param {String} userId - The user's ID
 * @param {String} type - The notification type
 * @param {String} message - The notification message
 * @param {Object} data - Additional data for the notification
 * @param {Number} priority - Priority level (1-5, 5 being highest)
 * @returns {Object} - The created notification
 */
const createNotification = (userId, type, message, data = {}, priority = 3) => {
  // Check user preferences
  const userPrefs = notificationData.userPreferences[userId];
  if (!userPrefs) {
    initUserPreferences(userId);
  }
  
  // Check if we should send this notification based on user preferences
  if (shouldSendNotification(userId, type, priority)) {
    const notification = {
      id: uuidv4(),
      userId,
      type,
      message,
      data,
      priority,
      timestamp: Date.now(),
      read: false
    };
    
    // Add to history
    notificationData.notificationHistory.push(notification);
    
    // Keep history manageable
    if (notificationData.notificationHistory.length > 1000) {
      notificationData.notificationHistory.shift();
    }
    
    // Update last notified time
    if (notificationData.userPreferences[userId]) {
      notificationData.userPreferences[userId].lastNotified = Date.now();
    }
    
    logger.info('Notification created', { notification });
    
    return notification;
  }
  
  return null;
};

/**
 * Determine if a notification should be sent based on user preferences
 * @param {String} userId - The user's ID
 * @param {String} type - The notification type
 * @param {Number} priority - Priority level
 * @returns {Boolean} - Whether the notification should be sent
 */
const shouldSendNotification = (userId, type, priority) => {
  const userPrefs = notificationData.userPreferences[userId];
  if (!userPrefs) return true; // Default to sending if no preferences
  
  // Check quiet hours
  if (userPrefs.quietHours && userPrefs.quietHours.enabled) {
    const now = new Date();
    const hour = now.getHours();
    
    if (hour >= userPrefs.quietHours.start || hour < userPrefs.quietHours.end) {
      // During quiet hours, only send high priority notifications
      if (priority < 4) return false;
    }
  }
  
  // Check notification type preferences
  if (type === 'system_alert' && !userPrefs.receiveSystemAlerts) return false;
  if (type === 'activity' && !userPrefs.receiveActivityNotifications) return false;
  if (type === 'anomaly' && !userPrefs.receiveAnomalyAlerts) return false;
  
  // Check notification frequency
  const timeSinceLastNotification = Date.now() - (userPrefs.lastNotified || 0);
  
  if (userPrefs.notificationFrequency === 'low' && timeSinceLastNotification < 3600000) { // 1 hour
    return priority >= 4; // Only high priority
  } else if (userPrefs.notificationFrequency === 'medium' && timeSinceLastNotification < 900000) { // 15 minutes
    return priority >= 3; // Medium and high priority
  } else if (userPrefs.notificationFrequency === 'high' && timeSinceLastNotification < 300000) { // 5 minutes
    return priority >= 2; // Most notifications except lowest priority
  }
  
  return true;
};

/**
 * Create a notification for a system anomaly
 * @param {Object} anomaly - The detected anomaly
 * @returns {Array} - The created notifications
 */
const notifyAnomalyDetected = (anomaly) => {
  const notifications = [];
  
  // Determine which users should be notified (admins always, affected users sometimes)
  const adminUserIds = ['admin']; // This should be fetched from your user system
  
  // Determine priority based on anomaly type
  let priority = 3;
  let message = 'System anomaly detected';
  
  switch (anomaly.type) {
    case 'slow_response':
      priority = 2;
      message = `Slow response detected for ${anomaly.data.path}`;
      break;
    case 'repeated_error':
      priority = 4;
      message = `Repeated error detected: ${anomaly.message}`;
      break;
    case 'rapid_user_actions':
      priority = 3;
      message = `Unusual activity detected for user`;
      // Also notify the affected user
      if (anomaly.userId) {
        const userNotification = createNotification(
          anomaly.userId,
          'anomaly',
          'Unusual activity detected on your account',
          anomaly,
          2
        );
        if (userNotification) notifications.push(userNotification);
      }
      break;
    case 'memory_usage_spike':
      priority = 5;
      message = `System memory usage spike detected (${anomaly.increase.toFixed(1)}% increase)`;
      break;
    default:
      message = `System anomaly detected: ${anomaly.type}`;
  }
  
  // Notify all admins
  adminUserIds.forEach(adminId => {
    const notification = createNotification(
      adminId,
      'anomaly',
      message,
      anomaly,
      priority
    );
    if (notification) notifications.push(notification);
  });
  
  return notifications;
};

/**
 * Predict and notify about potential system issues before they occur
 */
const predictiveNotifications = () => {
  // This would use the learned patterns to predict issues
  // For now, we'll implement a simple version
  
  const notifications = [];
  
  // Check for users who might be due for an action based on patterns
  Object.keys(notificationData.patterns).forEach(key => {
    const [userId, action] = key.split('-');
    const pattern = notificationData.patterns[key];
    
    // If we have a high confidence prediction and it's within the next 5 minutes
    if (pattern.confidence === 'high' && 
        pattern.predictedNext > Date.now() && 
        pattern.predictedNext < Date.now() + 300000) {
      
      const notification = createNotification(
        userId,
        'prediction',
        `You might want to ${action.replace('_', ' ')} soon`,
        { action, predictedTime: new Date(pattern.predictedNext).toISOString() },
        2
      );
      
      if (notification) notifications.push(notification);
    }
  });
  
  return notifications;
};

/**
 * Get notifications for a user
 * @param {String} userId - The user's ID
 * @param {Object} options - Options for filtering notifications
 * @returns {Array} - The user's notifications
 */
const getUserNotifications = (userId, options = {}) => {
  const { limit = 50, unreadOnly = false, types = null } = options;
  
  return notificationData.notificationHistory
    .filter(notification => 
      notification.userId === userId && 
      (!unreadOnly || !notification.read) &&
      (!types || types.includes(notification.type))
    )
    .sort((a, b) => b.timestamp - a.timestamp)
    .slice(0, limit);
};

/**
 * Mark notifications as read
 * @param {String} userId - The user's ID
 * @param {Array} notificationIds - IDs of notifications to mark as read
 * @returns {Number} - Number of notifications marked as read
 */
const markNotificationsAsRead = (userId, notificationIds) => {
  let count = 0;
  
  notificationData.notificationHistory.forEach(notification => {
    if (notification.userId === userId && 
        notificationIds.includes(notification.id) && 
        !notification.read) {
      notification.read = true;
      count++;
    }
  });
  
  logger.info('Notifications marked as read', { userId, count });
  
  return count;
};

// Start predictive notifications at regular intervals
const startPredictiveNotifications = () => {
  // Run predictive notifications every 5 minutes
  setInterval(predictiveNotifications, 300000);
  
  logger.info('Predictive notifications started');
};

module.exports = {
  initUserPreferences,
  updateUserPreferences,
  learnFromUserAction,
  createNotification,
  notifyAnomalyDetected,
  predictiveNotifications,
  getUserNotifications,
  markNotificationsAsRead,
  startPredictiveNotifications
};