const { verifyToken, verifyRefreshToken } = require('../config/auth');

// ---------------------- Helpers ---------------------- //
const jwtErrorMap = {
    'jwt expired': { message: 'Token has expired', code: 'TOKEN_EXPIRED' },
    'invalid signature': { message: 'Invalid token', code: 'INVALID_TOKEN' },
    'jwt malformed': { message: 'Malformed token', code: 'MALFORMED_TOKEN' }
};

const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Must contain an uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Must contain a lowercase letter');
    if (!/\d/.test(password)) errors.push('Must contain a number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Must contain a special character');
    return errors;
};

const validRoles = new Set(['student', 'lecturer', 'admin', 'administrator', 'sys_admin']);

// ---------------------- Middlewares ---------------------- //

// JWT authentication (required)
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required',
                error: 'NO_TOKEN'
            });
        }

        // Validate token format (basic JWT structure: header.payload.signature)
        if (typeof token !== 'string' || token.split('.').length !== 3) {
            return res.status(401).json({
                success: false,
                message: 'Invalid token format',
                error: 'MALFORMED_TOKEN'
            });
        }

        const decoded = verifyToken(token);
        
        // Check user status in database
        const User = require('../models/User');
        const userResult = await User.findById(decoded.id);
        if (!userResult.success) {
            return res.status(401).json({
                success: false,
                message: 'User not found',
                error: 'USER_NOT_FOUND'
            });
        }
        
        if (userResult.data.status === 'blocked') {
            return res.status(403).json({
                success: false,
                message: 'Your account has been blocked. Please contact the system administrator.',
                error: 'ACCOUNT_BLOCKED'
            });
        }
        
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role, status: userResult.data.status };
        return next();
    } catch (error) {
        console.error('Authentication error:', error);
        const { message, code } = jwtErrorMap[error.message] || {
            message: 'Invalid or expired token',
            code: 'AUTHENTICATION_FAILED'
        };
        return res.status(401).json({ success: false, message, error: code });
    }
};

// JWT authentication (optional)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];
        if (token && typeof token === 'string' && token.split('.').length === 3) {
            const decoded = verifyToken(token);
            req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        }
    } catch {
        // ignore token errors, continue as unauthenticated
    }
    next();
};

// Refresh token authentication
const authenticateRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required',
                error: 'NO_REFRESH_TOKEN'
            });
        }

        const decoded = verifyRefreshToken(refreshToken);
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        return next();
    } catch (error) {
        console.error('Refresh token authentication error:', error);
        return res.status(401).json({
            success: false,
            message: 'Invalid or expired refresh token',
            error: 'REFRESH_TOKEN_FAILED'
        });
    }
};

// Simple in-memory rate limiting for auth endpoints
const authRateLimit = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 minutes
    const maxAttempts = 5;

    if (!req.app.locals.authAttempts) req.app.locals.authAttempts = new Map();

    const attempts = req.app.locals.authAttempts.get(clientIP) || {
        count: 0,
        resetTime: now + windowMs
    };

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
            message: 'Too many authentication attempts. Try again later.',
            retryAfter: Math.ceil((attempts.resetTime - now) / 1000)
        });
    }

    next();
};

// ---------------------- Validation ---------------------- //

// Registration password validation
const validateRegistrationPassword = (req, res, next) => {
    const { password } = req.body;
    if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const errors = validatePassword(password);
    if (errors.length) {
        return res.status(400).json({
            success: false,
            message: 'Password does not meet requirements',
            errors
        });
    }

    next();
};

// New password validation
const validateNewPassword = (req, res, next) => {
    const { newPassword } = req.body;
    if (!newPassword) {
        return res.status(400).json({ success: false, message: 'New password is required' });
    }

    const errors = validatePassword(newPassword);
    if (errors.length) {
        return res.status(400).json({
            success: false,
            message: 'New password does not meet requirements',
            errors
        });
    }

    next();
};

// Email validation
const validateEmail = (req, res, next) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    next();
};

// Role validation
const validateRole = (req, res, next) => {
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, message: 'Role is required' });

    if (!validRoles.has(role)) {
        return res.status(400).json({
            success: false,
            message: `Invalid role. Must be one of: ${Array.from(validRoles).join(', ')}`
        });
    }

    next();
};

// ---------------------- Exports ---------------------- //
module.exports = {
    authenticateToken,
    optionalAuth,
    authenticateRefreshToken,
    authRateLimit,
    validateRegistrationPassword,
    validateNewPassword,
    validateEmail,
    validateRole
};
