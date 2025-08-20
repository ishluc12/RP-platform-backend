// Global error handling middleware

const errorHandler = (err, req, res, next) => {
    let error = { ...err };
    error.message = err.message;

    // Log error for debugging
    console.error('Error:', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date().toISOString()
    });

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        const message = Object.values(err.errors).map(val => val.message).join(', ');
        error = {
            message: 'Validation Error',
            errors: Object.values(err.errors).map(val => ({
                field: val.path,
                message: val.message,
                value: val.value
            }))
        };
        return res.status(400).json({
            success: false,
            message: error.message,
            errors: error.errors
        });
    }

    // Mongoose duplicate key error
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        const value = err.keyValue[field];
        error.message = `Duplicate field value: ${field} = ${value}. Please use another value.`;
        return res.status(400).json({
            success: false,
            message: error.message,
            field,
            value
        });
    }

    // Mongoose cast error (invalid ObjectId)
    if (err.name === 'CastError') {
        error.message = `Invalid ${err.path}: ${err.value}`;
        return res.status(400).json({
            success: false,
            message: error.message,
            field: err.path,
            value: err.value
        });
    }

    // JWT errors
    if (err.name === 'JsonWebTokenError') {
        error.message = 'Invalid token';
        return res.status(401).json({
            success: false,
            message: error.message,
            error: 'INVALID_TOKEN'
        });
    }

    if (err.name === 'TokenExpiredError') {
        error.message = 'Token expired';
        return res.status(401).json({
            success: false,
            message: error.message,
            error: 'TOKEN_EXPIRED'
        });
    }

    // Multer errors
    if (err.code === 'LIMIT_FILE_SIZE') {
        error.message = 'File too large';
        return res.status(400).json({
            success: false,
            message: error.message,
            error: 'FILE_TOO_LARGE'
        });
    }

    if (err.code === 'LIMIT_FILE_COUNT') {
        error.message = 'Too many files';
        return res.status(400).json({
            success: false,
            message: error.message,
            error: 'TOO_MANY_FILES'
        });
    }

    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
        error.message = 'Unexpected file field';
        return res.status(400).json({
            success: false,
            message: error.message,
            error: 'UNEXPECTED_FILE_FIELD'
        });
    }

    // Supabase errors
    if (err.code && err.code.startsWith('PGRST')) {
        error.message = 'Database operation failed';
        return res.status(500).json({
            success: false,
            message: error.message,
            error: 'DATABASE_ERROR',
            details: err.details || err.message
        });
    }

    // Cloudinary errors
    if (err.http_code && err.http_code >= 400) {
        error.message = 'File upload failed';
        return res.status(500).json({
            success: false,
            message: error.message,
            error: 'UPLOAD_ERROR',
            details: err.message
        });
    }

    // Rate limiting errors
    if (err.status === 429) {
        return res.status(429).json({
            success: false,
            message: 'Too many requests. Please try again later.',
            error: 'RATE_LIMIT_EXCEEDED',
            retryAfter: err.retryAfter || 60
        });
    }

    // Validation errors from express-validator
    if (err.type === 'validation') {
        return res.status(400).json({
            success: false,
            message: 'Validation failed',
            errors: err.errors
        });
    }

    // Custom application errors
    if (err.isOperational) {
        return res.status(err.statusCode || 400).json({
            success: false,
            message: err.message,
            error: err.errorCode || 'OPERATIONAL_ERROR'
        });
    }

    // Default error
    const statusCode = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';

    // Don't leak error details in production
    const errorResponse = {
        success: false,
        message: statusCode === 500 ? 'Internal Server Error' : message
    };

    // Add error details in development
    if (process.env.NODE_ENV === 'development') {
        errorResponse.error = {
            message: err.message,
            stack: err.stack,
            name: err.name,
            code: err.code
        };
    }

    res.status(statusCode).json(errorResponse);
};

// 404 handler for unmatched routes
const notFound = (req, res, next) => {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};

// Async error wrapper for controllers
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Error logger for external services
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

    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
        console.error('Error Log:', errorLog);
    }

    // In production, you might want to send this to an external logging service
    // like Sentry, LogRocket, or your own logging system

    return errorLog;
};

module.exports = {
    errorHandler,
    notFound,
    asyncHandler,
    logError
};
