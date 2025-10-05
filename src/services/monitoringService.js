/**
 * System Monitoring Service
 * Provides functionality to monitor system activities and detect patterns
 */
const fs = require('fs');
const path = require('path');
const winston = require('winston');
const { v4: uuidv4 } = require('uuid');

// Create a logger for the monitoring service
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  defaultMeta: { service: 'monitoring-service' },
  transports: [
    new winston.transports.File({ filename: 'logs/monitoring.log' }),
  ],
});

// In-memory storage for system metrics
let systemMetrics = {
  requests: [],
  errors: [],
  userActivities: {},
  systemLoad: [],
  anomalies: []
};

// Training data for pattern recognition
const trainingData = {
  normalPatterns: {},
  anomalyPatterns: {}
};

/**
 * Track a system request
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const trackRequest = (req, res) => {
  const requestData = {
    id: uuidv4(),
    timestamp: Date.now(),
    method: req.method,
    path: req.path,
    userId: req.user ? req.user.id : 'anonymous',
    userAgent: req.headers['user-agent'],
    ip: req.ip,
    responseTime: 0,
    statusCode: 0
  };
  
  // Store the start time
  const startTime = process.hrtime();
  
  // Once the response is finished, calculate metrics
  res.on('finish', () => {
    const hrTime = process.hrtime(startTime);
    const responseTimeMs = hrTime[0] * 1000 + hrTime[1] / 1000000;
    
    requestData.responseTime = responseTimeMs;
    requestData.statusCode = res.statusCode;
    
    // Add to metrics
    systemMetrics.requests.push(requestData);
    
    // Keep only the last 1000 requests
    if (systemMetrics.requests.length > 1000) {
      systemMetrics.requests.shift();
    }
    
    // Log the request
    logger.info('Request tracked', { requestData });
    
    // Check for anomalies
    detectRequestAnomalies(requestData);
  });
};

/**
 * Track an error in the system
 * @param {Error} error - The error object
 * @param {Object} context - Additional context about where the error occurred
 */
const trackError = (error, context = {}) => {
  const errorData = {
    id: uuidv4(),
    timestamp: Date.now(),
    message: error.message,
    stack: error.stack,
    code: error.code,
    context
  };
  
  // Add to metrics
  systemMetrics.errors.push(errorData);
  
  // Keep only the last 100 errors
  if (systemMetrics.errors.length > 100) {
    systemMetrics.errors.shift();
  }
  
  // Log the error
  logger.error('Error tracked', { errorData });
  
  // Check for error patterns
  detectErrorPatterns();
};

/**
 * Track user activity
 * @param {String} userId - The user's ID
 * @param {String} action - The action performed
 * @param {Object} data - Additional data about the action
 */
const trackUserActivity = (userId, action, data = {}) => {
  if (!systemMetrics.userActivities[userId]) {
    systemMetrics.userActivities[userId] = [];
  }
  
  const activityData = {
    id: uuidv4(),
    timestamp: Date.now(),
    action,
    data
  };
  
  // Add to user's activities
  systemMetrics.userActivities[userId].push(activityData);
  
  // Keep only the last 100 activities per user
  if (systemMetrics.userActivities[userId].length > 100) {
    systemMetrics.userActivities[userId].shift();
  }
  
  // Log the activity
  logger.info('User activity tracked', { userId, activityData });
  
  // Analyze user behavior
  analyzeUserBehavior(userId);
};

/**
 * Track system load
 */
const trackSystemLoad = () => {
  const loadData = {
    timestamp: Date.now(),
    memoryUsage: process.memoryUsage(),
    cpuUsage: process.cpuUsage()
  };
  
  // Add to metrics
  systemMetrics.systemLoad.push(loadData);
  
  // Keep only the last 100 load measurements
  if (systemMetrics.systemLoad.length > 100) {
    systemMetrics.systemLoad.shift();
  }
  
  // Log the load
  logger.info('System load tracked', { loadData });
  
  // Check for system overload
  detectSystemOverload();
};

/**
 * Detect anomalies in request patterns
 * @param {Object} requestData - Data about the request
 */
const detectRequestAnomalies = (requestData) => {
  // Simple anomaly detection: unusually slow response time
  const recentRequests = systemMetrics.requests.slice(-50);
  if (recentRequests.length > 10) {
    const avgResponseTime = recentRequests.reduce((sum, req) => sum + req.responseTime, 0) / recentRequests.length;
    
    // If response time is 3x the average, flag as anomaly
    if (requestData.responseTime > avgResponseTime * 3 && requestData.responseTime > 500) {
      const anomaly = {
        id: uuidv4(),
        timestamp: Date.now(),
        type: 'slow_response',
        data: requestData,
        avgResponseTime
      };
      
      systemMetrics.anomalies.push(anomaly);
      logger.warn('Request anomaly detected', { anomaly });
      
      // Notify about the anomaly
      return anomaly;
    }
  }
  
  return null;
};

/**
 * Detect patterns in errors
 */
const detectErrorPatterns = () => {
  const recentErrors = systemMetrics.errors.slice(-20);
  if (recentErrors.length < 5) return null;
  
  // Check for repeated errors in a short time
  const errorMessages = recentErrors.map(err => err.message);
  const messageCounts = {};
  
  errorMessages.forEach(msg => {
    messageCounts[msg] = (messageCounts[msg] || 0) + 1;
  });
  
  // If any error occurs more than 3 times in the recent errors
  for (const [message, count] of Object.entries(messageCounts)) {
    if (count >= 3) {
      const anomaly = {
        id: uuidv4(),
        timestamp: Date.now(),
        type: 'repeated_error',
        message,
        count,
        errors: recentErrors.filter(err => err.message === message)
      };
      
      systemMetrics.anomalies.push(anomaly);
      logger.warn('Error pattern detected', { anomaly });
      
      // Notify about the anomaly
      return anomaly;
    }
  }
  
  return null;
};

/**
 * Analyze user behavior for unusual patterns
 * @param {String} userId - The user's ID
 */
const analyzeUserBehavior = (userId) => {
  const userActivities = systemMetrics.userActivities[userId];
  if (!userActivities || userActivities.length < 10) return null;
  
  // Check for rapid succession of actions
  const recentActivities = userActivities.slice(-10);
  const timestamps = recentActivities.map(activity => activity.timestamp);
  
  // Calculate time differences between consecutive activities
  const timeDiffs = [];
  for (let i = 1; i < timestamps.length; i++) {
    timeDiffs.push(timestamps[i] - timestamps[i-1]);
  }
  
  // Calculate average time difference
  const avgTimeDiff = timeDiffs.reduce((sum, diff) => sum + diff, 0) / timeDiffs.length;
  
  // If average time between actions is very small (less than 1 second)
  if (avgTimeDiff < 1000 && timeDiffs.length > 5) {
    const anomaly = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'rapid_user_actions',
      userId,
      avgTimeDiff,
      activities: recentActivities
    };
    
    systemMetrics.anomalies.push(anomaly);
    logger.warn('Unusual user behavior detected', { anomaly });
    
    // Notify about the anomaly
    return anomaly;
  }
  
  return null;
};

/**
 * Detect system overload conditions
 */
const detectSystemOverload = () => {
  if (systemMetrics.systemLoad.length < 5) return null;
  
  const recentLoads = systemMetrics.systemLoad.slice(-5);
  
  // Check memory usage trend
  const memoryUsages = recentLoads.map(load => load.memoryUsage.heapUsed);
  const initialMemory = memoryUsages[0];
  const currentMemory = memoryUsages[memoryUsages.length - 1];
  
  // If memory usage increased by more than 50% in the last 5 measurements
  if (currentMemory > initialMemory * 1.5) {
    const anomaly = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: 'memory_usage_spike',
      initialMemory,
      currentMemory,
      increase: ((currentMemory - initialMemory) / initialMemory) * 100
    };
    
    systemMetrics.anomalies.push(anomaly);
    logger.warn('System memory usage spike detected', { anomaly });
    
    // Notify about the anomaly
    return anomaly;
  }
  
  return null;
};

/**
 * Get all detected anomalies
 * @param {Number} limit - Maximum number of anomalies to return
 * @returns {Array} - List of anomalies
 */
const getAnomalies = (limit = 100) => {
  return systemMetrics.anomalies.slice(-limit);
};

/**
 * Get system health metrics
 * @returns {Object} - System health metrics
 */
const getSystemHealth = () => {
  const requestCount = systemMetrics.requests.length;
  const errorCount = systemMetrics.errors.length;
  const userCount = Object.keys(systemMetrics.userActivities).length;
  const anomalyCount = systemMetrics.anomalies.length;
  
  // Calculate error rate
  const errorRate = requestCount > 0 ? (errorCount / requestCount) * 100 : 0;
  
  // Get recent system load
  const recentLoad = systemMetrics.systemLoad.slice(-1)[0] || { memoryUsage: { heapUsed: 0 }, cpuUsage: { user: 0, system: 0 } };
  
  return {
    timestamp: Date.now(),
    requestCount,
    errorCount,
    errorRate,
    userCount,
    anomalyCount,
    memoryUsage: recentLoad.memoryUsage,
    cpuUsage: recentLoad.cpuUsage
  };
};

// Start tracking system load at regular intervals
const startSystemMonitoring = () => {
  // Track system load every 30 seconds
  setInterval(trackSystemLoad, 30000);
  
  logger.info('System monitoring started');
};

module.exports = {
  trackRequest,
  trackError,
  trackUserActivity,
  trackSystemLoad,
  getAnomalies,
  getSystemHealth,
  startSystemMonitoring
};