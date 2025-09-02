// D:\final-year-project\backend\src\utils\responseHandlers.js
/**
 * This file contains utility functions for handling responses.
 * It includes functions for sending success and error responses.
 *
 * Use these functions to standardize API responses throughout the application.
 */
const { logger } = require("./logger");

const sendSuccessResponse = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    success: true,
    message,
    data,
  });
};

const sendErrorResponse = (res, statusCode, message, details = null) => {
  logger.error(`${message}`);
  res.status(statusCode).json({
    success: false,
    message,
    error: details,
  });
};

module.exports = { response: sendSuccessResponse, errorResponse: sendErrorResponse };