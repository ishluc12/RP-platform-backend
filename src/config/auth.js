const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
require('dotenv').config();

/**
 * Middleware to authenticate JWT tokens
 */
const authenticate = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access token is missing' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (error) {
        console.error('JWT verification error:', error);
        return res.status(403).json({ success: false, message: 'Invalid or expired token' });
    }
};

/**
 * Middleware to authorize based on role
 */
const authorize = (roles = []) => {
    if (typeof roles === 'string') {
        roles = [roles];
    }

    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        if (roles.length && !roles.includes(req.user.role)) {
            return res.status(403).json({ success: false, message: 'Forbidden: insufficient permissions' });
        }

        next();
    };
};

/**
 * Rate limiter for auth-related endpoints
 */
const authRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 10, // limit each IP to 10 requests per windowMs
    message: { success: false, message: 'Too many requests, please try again later.' },
});

/**
 * Validate email in request body
 */
const validateEmail = (req, res, next) => {
    if (!req.body || !req.body.email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
    }

    const { email } = req.body;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(email)) {
        return res.status(400).json({ success: false, message: 'Invalid email format' });
    }

    next();
};

/**
 * Validate password in request body
 */
const validatePassword = (req, res, next) => {
    if (!req.body || !req.body.password) {
        return res.status(400).json({ success: false, message: 'Password is required' });
    }

    const { password } = req.body;
    if (password.length < 6) {
        return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
    }

    next();
};

/**
 * Hash password utility
 */
const hashPassword = async (password) => {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS, 10) || 12;
    return await bcrypt.hash(password, saltRounds);
};

/**
 * Compare password utility
 */
const comparePassword = async (password, hash) => {
    return await bcrypt.compare(password, hash);
};

/**
 * JWT token generator
 */
const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN || "15m" });
};

/**
 * JWT refresh token generator
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || "7d" });
};

/**
 * JWT token verifiers (fix)
 */
const verifyToken = (token) => {
    return jwt.verify(token, process.env.JWT_SECRET);
};

const verifyRefreshToken = (token) => {
    return jwt.verify(token, process.env.JWT_REFRESH_SECRET);
};

module.exports = {
    authenticate,
    authorize,
    authRateLimit,
    validateEmail,
    validatePassword,
    hashPassword,
    comparePassword,
    generateToken,
    generateRefreshToken,
    verifyToken,          
    verifyRefreshToken    
};
