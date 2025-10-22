const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');
const administratorAvailabilityController = require('../../controllers/administrator/administratorAvailabilityController');

const ADMIN_ROLES = ['administrator', 'admin', 'sys_admin'];

// All routes require authentication and admin roles
router.use(authenticateToken);
router.use(requireRoles(ADMIN_ROLES));

// --- AVAILABILITY ROUTES ---

// Create availability slot
router.post('/', administratorAvailabilityController.createAvailability);

// Get all availability slots  
router.get('/', administratorAvailabilityController.getMyAvailability);

// Update a specific availability slot
router.put('/:id', administratorAvailabilityController.updateAvailability);

// Delete a specific availability slot
router.delete('/:id', administratorAvailabilityController.deleteAvailability);

module.exports = router;