const { body, validationResult } = require('express-validator');
const { sendErrorResponse } = require('../utils/responseHandlers');

// Event validation middleware
const validateEvent = [
    body('title')
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Title is required and must be between 1 and 255 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
    
    body('event_date')
        .isISO8601()
        .withMessage('Event date must be a valid ISO 8601 date')
        .custom((value) => {
            const eventDate = new Date(value);
            const now = new Date();
            if (eventDate <= now) {
                throw new Error('Event date must be in the future');
            }
            return true;
        }),
    
    body('location')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Location must be less than 255 characters'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => err.msg);
            return sendErrorResponse(res, 400, 'Validation failed', errorMessages);
        }
        next();
    }
];

// Event update validation middleware (allows partial updates)
const validateEventUpdate = [
    body('title')
        .optional()
        .trim()
        .isLength({ min: 1, max: 255 })
        .withMessage('Title must be between 1 and 255 characters'),
    
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description must be less than 1000 characters'),
    
    body('event_date')
        .optional()
        .isISO8601()
        .withMessage('Event date must be a valid ISO 8601 date')
        .custom((value) => {
            const eventDate = new Date(value);
            const now = new Date();
            if (eventDate <= now) {
                throw new Error('Event date must be in the future');
            }
            return true;
        }),
    
    body('location')
        .optional()
        .trim()
        .isLength({ max: 255 })
        .withMessage('Location must be less than 255 characters'),
    
    (req, res, next) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const errorMessages = errors.array().map(err => err.msg);
            return sendErrorResponse(res, 400, 'Validation failed', errorMessages);
        }
        next();
    }
];

module.exports = {
    validateEvent,
    validateEventUpdate
};
