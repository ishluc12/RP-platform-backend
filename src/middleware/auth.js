const { verifyToken, verifyRefreshToken } = require('../config/auth');

// JWT authentication middleware
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1]; // Bearer TOKEN

        if (!token) {
            return res.status(401).json({
                success: false,
                message: 'Access token is required'
            });
        }

        const decoded = verifyToken(token);
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        next();
    } catch (error) {
        console.error('Authentication error:', error);
        let message = 'Invalid or expired token';
        let code = 'AUTHENTICATION_FAILED';

        if (error.message === 'jwt expired') {
            message = 'Token has expired';
            code = 'TOKEN_EXPIRED';
        } else if (error.message === 'invalid signature') {
            message = 'Invalid token';
            code = 'INVALID_TOKEN';
        }

        return res.status(401).json({ success: false, message, error: code });
    }
};

// Optional authentication (token not required)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = authHeader?.split(' ')[1];

        if (token) {
            const decoded = verifyToken(token);
            req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
        }

        next();
    } catch {
        next(); // ignore errors, continue as unauthenticated
    }
};

// Refresh token middleware
const authenticateRefreshToken = async (req, res, next) => {
    try {
        const { refreshToken } = req.body;
        if (!refreshToken) {
            return res.status(401).json({
                success: false,
                message: 'Refresh token is required'
            });
        }

        const decoded = verifyRefreshToken(refreshToken);
        req.user = { id: decoded.id, email: decoded.email, role: decoded.role };
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

// Simple rate limiting for auth endpoints
const authRateLimit = (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowMs = 15 * 60 * 1000; // 15 min
    const maxAttempts = 5;

    if (!req.app.locals.authAttempts) req.app.locals.authAttempts = new Map();

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
            message: 'Too many authentication attempts. Try again later.',
            retryAfter: Math.ceil((attempts.resetTime - now) / 1000)
        });
    }

    next();
};

// Password validation
const validateRegistrationPassword = (req, res, next) => {
    const password = req.body.password;

    if (!password) {
        return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const errors = [];
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Must contain an uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Must contain a lowercase letter');
    if (!/\d/.test(password)) errors.push('Must contain a number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Must contain a special character');

    if (errors.length) {
        return res.status(400).json({ success: false, message: 'Password does not meet requirements', errors });
    }

    next();
};
const validateNewPassword = (req, res, next) => {
    const password = req.body.newPassword;

    if (!password) {
        return res.status(400).json({ success: false, message: 'New password is required' });
    }

    const errors = [];
    if (password.length < 8) errors.push('Password must be at least 8 characters');
    if (!/[A-Z]/.test(password)) errors.push('Must contain an uppercase letter');
    if (!/[a-z]/.test(password)) errors.push('Must contain a lowercase letter');
    if (!/\d/.test(password)) errors.push('Must contain a number');
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) errors.push('Must contain a special character');

    if (errors.length) {
        return res.status(400).json({ success: false, message: 'New password does not meet requirements', errors });
    }

    next();
};
// Email validation
const validateEmail = (req, res, next) => {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) return res.status(400).json({ success: false, message: 'Invalid email format' });

    next();
};

// Role validation
const validateRole = (req, res, next) => {
    const { role } = req.body;
    if (!role) return res.status(400).json({ success: false, message: 'Role is required' });

    const validRoles = ['student', 'lecturer', 'admin', 'administrator', 'sys_admin'];
    if (!validRoles.includes(role)) return res.status(400).json({ success: false, message: 'Invalid role. Must be one of: student, lecturer, admin, administrator, sys_admin' });

    next();
};

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
