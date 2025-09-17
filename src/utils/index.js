/**
 * This file aggregates utility functions and modules.
 * It currently exports the logger and response handler functions.
 *
 * Add more utility functions here as needed.
 */
const { logger } = require('./logger');
const { successResponse, errorResponse } = require('./responseHandlers');

module.exports = {
    logger,
    successResponse,
    errorResponse,
};
