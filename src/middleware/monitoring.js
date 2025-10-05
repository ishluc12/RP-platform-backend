/**
 * Monitoring Middleware
 * Integrates the ML monitoring system with the Express application
 */
const monitoringService = require('../services/monitoringService');
const mlNotificationService = require('../services/mlNotificationService');

/**
 * Middleware to track all requests
 */
const trackRequests = (req, res, next) => {
  monitoringService.trackRequest(req, res);
  next();
};

/**
 * Error tracking middleware
 */
const trackErrors = (err, req, res, next) => {
  monitoringService.trackError(err, {
    path: req.path,
    method: req.method,
    userId: req.user ? req.user.id : 'anonymous'
  });
  
  next(err);
};

module.exports = {
  trackRequests,
  trackErrors
};