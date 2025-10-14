const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');
const {
    createAvailability,
    getMyAvailability,
    updateAvailability,
    deleteAvailability
} = require('../../controllers/administrator/administratorAvailabilityController');

// All routes require authentication and administrator role
router.use(authenticateToken);
router.use(requireRoles('administrator', 'admin', 'sys_admin'));

// Create/update availability slots (bulk)
router.post('/', createAvailability);

// View own availability
router.get('/', getMyAvailability);

// Update a slot
router.put('/:id', updateAvailability);

// Delete a slot
router.delete('/:id', deleteAvailability);

module.exports = router;
