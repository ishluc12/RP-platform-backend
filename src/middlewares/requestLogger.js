/**
 * This middleware logs incoming requests to the server.
 * It logs the HTTP method and the requested URL.
 *
 * Use this middleware to track requests for debugging and monitoring purposes.
 */
import { logger } from "../utils/logger.js";

export const requestLogger = (req, res, next) => {
  logger.info(`${req.method} request ${req.method}:${req.originalUrl}`);
  next();
};
