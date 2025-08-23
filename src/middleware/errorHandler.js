// Global error handling middleware
const errorHandler = (err, req, res, next) => {
    // Clone error to avoid mutation
    const error = { ...err, message: err.message };

    // Log error for debugging
    console.error({
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

    // Handle specific known errors
    switch (true) {
        // Mongoose validation error
        case err.name === 'ValidationError': {
            const errors = Object.values(err.errors).map(val => ({
                field: val.path,
                message: val.message,
                value: val.value
            }));
            return res.status(400).json({ success: false, message: 'Validation Error', errors });
        }

        // Mongoose duplicate key error
        case err.code === 11000: {
            const field = Object.keys(err.keyValue)[0];
            const value = err.keyValue[field];
            return res.status(400).json({
                success: false,
                message: `Duplicate field value: ${field} = ${value}. Please use another value.`,
                field,
                value
            });
        }

        // Mongoose cast error
        case err.name === 'CastError':
            return res.status(400).json({
                success: false,
                message: `Invalid ${err.path}: ${err.value}`,
                field: err.path,
                value: err.value
            });

        // JWT errors
        case err.name === 'JsonWebTokenError':
            return res.status(401).json({ success: false, message: 'Invalid token', error: 'INVALID_TOKEN' });
        case err.name === 'TokenExpiredError':
            return res.status(401).json({ success: false, message: 'Token expired', error: 'TOKEN_EXPIRED' });

        // Multer errors
        case ['LIMIT_FILE_SIZE', 'LIMIT_FILE_COUNT', 'LIMIT_UNEXPECTED_FILE'].includes(err.code): {
            const messages = {
                LIMIT_FILE_SIZE: 'File too large',
                LIMIT_FILE_COUNT: 'Too many files',
                LIMIT_UNEXPECTED_FILE: 'Unexpected file field'
            };
            return res.status(400).json({ success: false, message: messages[err.code], error: err.code });
        }

        // Supabase errors
        case err.code?.startsWith('PGRST'):
            return res.status(500).json({
                success: false,
                message: 'Database operation failed',
                error: 'DATABASE_ERROR',
                details: err.details || err.message
            });

        // Cloudinary errors
        case err.http_code >= 400:
            return res.status(500).json({
                success: false,
                message: 'File upload failed',
                error: 'UPLOAD_ERROR',
                details: err.message
            });

        // Rate limiting errors
        case err.status === 429:
            return res.status(429).json({
                success: false,
                message: 'Too many requests. Please try again later.',
                error: 'RATE_LIMIT_EXCEEDED',
                retryAfter: err.retryAfter || 60
            });

        // Express-validator or custom validation errors
        case err.type === 'validation':
            return res.status(400).json({ success: false, message: 'Validation failed', errors: err.errors });
        case err.isOperational:
            return res.status(err.statusCode || 400).json({
                success: false,
                message: err.message,
                error: err.errorCode || 'OPERATIONAL_ERROR'
            });

        // Default error
        default:
            const statusCode = err.statusCode || 500;
            const message = statusCode === 500 ? 'Internal Server Error' : err.message;
            const response = { success: false, message };

            if (process.env.NODE_ENV === 'development') {
                response.error = { message: err.message, stack: err.stack, name: err.name, code: err.code };
            }

            return res.status(statusCode).json(response);
    }
};

// 404 handler for unmatched routes
const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

// Async wrapper for controllers
const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// External error logger
const logError = (error, context = {}) => {
    const errorLog = {
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        name: error.name,
        code: error.code,
        context,
        environment: process.env.NODE_ENV || 'development'
    };

    if (process.env.NODE_ENV === 'development') console.error('Error Log:', errorLog);

    // In production, send to Sentry, LogRocket, etc.
    return errorLog;
};

module.exports = { errorHandler, notFound, asyncHandler, logError };
