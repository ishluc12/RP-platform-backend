/**
 * This file contains utility functions for handling responses.
 * It includes functions for sending success and error responses.
 *
 * Use these functions to standardize API responses throughout the application.
 */
import { logger } from "./logger.js";

export const successResponse = (res, statusCode, data = null) => {
  res.status(statusCode).json({ success: true, data });
};

export const errorResponse = (err, req, res, next) => {
  logger.error(`${err?.message}`);
  res
    .status(err?.status || 500)
    .json({ success: false, message: err?.message || "Internal server Error" });
};
