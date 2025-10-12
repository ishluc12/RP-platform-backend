const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');
const administratorAvailabilityController = require('../../controllers/administrator/administratorAvailabilityController');

const ADMIN_ROLES = ['administrator', 'admin', 'sys_admin'];

// All routes require authentication
router.use(authenticateToken);

// --- AVAILABILITY ROUTES ---

// Create availability slot
router.post('/', requireRoles(ADMIN_ROLES), administratorAvailabilityController.createAvailability);

// Get all availability slots
router.get('/', requireRoles(ADMIN_ROLES), administratorAvailabilityController.getMyAvailability);

// Update a specific availability slot
router.put('/:id', requireRoles(ADMIN_ROLES), administratorAvailabilityController.updateAvailability);

// Delete a specific availability slot
router.delete('/:id', requireRoles(ADMIN_ROLES), administratorAvailabilityController.deleteAvailability);

module.exports = router;