const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireLecturerOrAdmin } = require('../../middleware/roleAuth');
const {
    createException,
    getExceptions,
    getUpcomingExceptions,
    updateException,
    deleteException
} = require('../../controllers/lecturer/lecturerExceptionController');

// All routes require authentication and lecturer/admin role
router.use(authenticateToken);
router.use(requireLecturerOrAdmin);

// Create availability exception
router.post('/', createException);

// Get availability exceptions
router.get('/', getExceptions);

// Get upcoming exceptions
router.get('/upcoming', getUpcomingExceptions);

// Update availability exception
router.put('/:id', updateException);

// Delete availability exception
router.delete('/:id', deleteException);

module.exports = router;
