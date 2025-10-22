const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');
const {
    createException,
    getExceptions,
    getUpcomingExceptions,
    updateException,
    deleteException
} = require('../../controllers/administrator/administratorExceptionController');

const ADMIN_ROLES = ['administrator', 'admin', 'sys_admin'];

// All routes require authentication and administrator role
router.use(authenticateToken);
router.use(requireRoles(...ADMIN_ROLES));

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
