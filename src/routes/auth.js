const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const AuthController = require('../controllers/auth/authController');

const {
    authenticateToken,
    authRateLimit,
    validateRegistrationPassword,
    validateNewPassword,
    validateEmail,
    validateRole
} = require('../middleware/auth');

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/profiles';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const fileFilter = (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Only image files are allowed'), false);
    }
};

const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Public routes (no authentication required)
// Registration route
router.post('/register', [
    authRateLimit,
    validateEmail,
    validateRegistrationPassword,
    validateRole
], AuthController.register);

// Change password route
router.post('/change-password', [
    authenticateToken,
    validateNewPassword
], AuthController.changePassword);

router.post('/login', [
    authRateLimit,
    validateEmail
], AuthController.login);

router.post('/refresh-token', [
    authRateLimit
], AuthController.refreshToken);

router.post('/forgot-password', [
    authRateLimit,
    validateEmail
], AuthController.forgotPassword);

router.post('/reset-password', [
    authRateLimit,
    validateNewPassword
], AuthController.resetPassword);

// Protected routes (authentication required)
router.use(authenticateToken);

router.post('/logout', AuthController.logout);

router.get('/profile', AuthController.getProfile);

router.put('/profile', AuthController.updateProfile);

router.post('/profile/picture',
    upload.single('profile_picture'),
    AuthController.uploadProfilePicture
);

router.put('/change-password', [validateNewPassword], AuthController.changePassword);
// Health check for authenticated users
router.get('/health', (req, res) => {
    res.json({
        success: true,
        message: 'Authentication service is healthy',
        user: {
            id: req.user.id,
            email: req.user.email,
            role: req.user.role
        },
        timestamp: new Date().toISOString()
    });
});

// Error handling for file uploads
router.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File too large. Maximum size is 5MB.'
            });
        }
        if (error.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Too many files. Only one file is allowed.'
            });
        }
        if (error.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected file field.'
            });
        }
    }

    if (error.message === 'Only image files are allowed') {
        return res.status(400).json({
            success: false,
            message: 'Only image files are allowed.'
        });
    }

    next(error);
});

module.exports = router;
