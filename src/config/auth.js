const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Validate that all required JWT environment variables are set
const validateJwtEnvVars = () => {
    const requiredVars = ['JWT_SECRET', 'JWT_REFRESH_SECRET'];
    const missingVars = requiredVars.filter(varName => !process.env[varName]);

    if (missingVars.length > 0) {
        console.error(`Missing JWT environment variables: ${missingVars.join(', ')}`);
        throw new Error(`Missing JWT environment variables: ${missingVars.join(', ')}`);
    }
};

// Immediately validate environment variables
validateJwtEnvVars();

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;

/**
 * Generate a JWT token
 * @param {object} payload - The data to encode in the token
 * @returns {string} - JWT token
 */
const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

/**
 * Generate a JWT refresh token
 * @param {object} payload - The data to encode in the refresh token
 * @returns {string} - JWT refresh token
 */
const generateRefreshToken = (payload) => {
    return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: JWT_REFRESH_EXPIRES_IN });
};

/**
 * Verify a JWT token
 * @param {string} token
 * @returns {object} - Decoded token payload
 * @throws {Error} - If token is invalid or expired
 */
const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired token');
    }
};

/**
 * Verify a JWT refresh token
 * @param {string} token
 * @returns {object} - Decoded token payload
 * @throws {Error} - If refresh token is invalid or expired
 */
const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, JWT_REFRESH_SECRET);
    } catch (error) {
        throw new Error('Invalid or expired refresh token');
    }
};

/**
 * Hash a plain password
 * @param {string} password
 * @returns {Promise<string>} - Hashed password
 */
const hashPassword = async (password) => {
    return await bcrypt.hash(password, BCRYPT_ROUNDS);
};

/**
 * Compare a plain password with a hashed password
 * @param {string} password - Plain text password
 * @param {string} hashedPassword - Stored hashed password
 * @returns {Promise<boolean>} - True if match, false otherwise
 */
const comparePassword = async (password, hashedPassword) => {
    return await bcrypt.compare(password, hashedPassword);
};

module.exports = {
    generateToken,
    generateRefreshToken,
    verifyToken,
    verifyRefreshToken,
    hashPassword,
    comparePassword,
    JWT_SECRET,
    JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN
};
