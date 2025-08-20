const { verifyToken } = require('../config/auth');

// JWT Authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        // Verify token
        const decoded = verifyToken(token);

        // Add user info to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        console.error('Authentication error:', error);

        if (error.message === 'jwt expired') {
            return res.status(401).json({
                success: false,
                message: 'Token has expired',
                error: 'TOKEN_EXPIRED'
            });
        }

        if (error.message === 'invalid signature') {
            return res.status(401).json({
                success: false,
                message: 'Invalid token',
                error: 'INVALID_TOKEN'
            });
        }

        return res.status(401).json({
            success: false,
            message: 'Invalid or expired token',
            error: 'AUTHENTICATION_FAILED'
        });
    }
};

// Optional authentication middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader && authHeader.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            req.user = {
                id: decoded.id,
                email: decoded.email,
                role: decoded.role
            };
        }

        next();
    } catch (error) {
        // Continue without authentication
        next();
    }
};

// Refresh token authentication middleware
const authenticateRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        // Verify refresh token
        const { verifyRefreshToken } = require('../config/auth');
        const decoded = verifyRefreshToken(refreshToken);

        // Add user info to request
        req.user = {
            id: decoded.id,
            email: decoded.email,
            role: decoded.role
        };

        next();
    } catch (error) {
        console.error('Refresh token authentication error:', error);

        return res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token',
            error: 'REFRESH_TOKEN_FAILED'
        });
    }
};

// Rate limiting for authentication endpoints
const authRateLimit = (req, res, next) => {
    // Simple in-memory rate limiting
    // In production, use Redis or a proper rate limiting library

    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    if (!req.app.locals.authAttempts) {
        req.app.locals.authAttempts = new Map();
    }

    const attempts = req.app.locals.authAttempts.get(clientIP) || { count: 0, resetTime: now + windowMs };

    if (now > attempts.resetTime) {
        attempts.count = 1;
        attempts.resetTime = now + windowMs;
    } else {
        attempts.count++;
    }

    req.app.locals.authAttempts.set(clientIP, attempts);

    if (attempts.count > maxAttempts) {
        return res.status(429).json({
            success: false,
            message: 'Too many authentication attempts. Please try again later.',
            retryAfter: Math.ceil((attempts.resetTime - now) / 1000)
        });
    }

    next();
};

// Password strength validation middleware
const validatePasswordStrength = (req, res, next) => {
    const { password } = req.body;

    if (!password) {
        return res.status(400).json({
            success: false,
            message: 'Password is required'
        });
    }

    // Password strength requirements
    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    const errors = [];

    if (password.length < minLength) {
        errors.push(`Password must be at least ${minLength} characters long`);
    }
    if (!hasUpperCase) {
        errors.push('Password must contain at least one uppercase letter');
    }
    if (!hasLowerCase) {
        errors.push('Password must contain at least one lowercase letter');
    }
    if (!hasNumbers) {
        errors.push('Password must contain at least one number');
    }
    if (!hasSpecialChar) {
        errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
        return res.status(400).json({
            success: false,
            message: 'Password does not meet requirements',
            errors
        });
    }

    next();
};

// Email validation middleware
const validateEmail = (req, res, next) => {
    const { email } = req.body;

    if (!email) {
        return res.status(400).json({
            success: false,
            message: 'Email is required'
        });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid email format'
        });
    }

    next();
};

// Role validation middleware
const validateRole = (req, res, next) => {
    const { role } = req.body;

    if (!role) {
        return res.status(400).json({
            success: false,
            message: 'Role is required'
        });
    }

    const validRoles = ['student', 'lecturer', 'admin'];
    if (!validRoles.includes(role)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid role. Must be student, lecturer, or admin'
        });
    }

    next();
};

module.exports = {
    authenticateToken,
    optionalAuth,
    authenticateRefreshToken,
    authRateLimit,
    validatePasswordStrength,
    validateEmail,
    validateRole
};
