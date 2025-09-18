const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireLecturerOrAdmin } = require('../../middleware/roleAuth');
const {
    createAvailability,
    getMyAvailability,
    updateAvailability,
    deleteAvailability
} = require('../../controllers/lecturer/lecturerAvailabilityController');

// All routes require authentication and lecturer/admin role
router.use(authenticateToken);
router.use(requireLecturerOrAdmin);

// Create/update availability slots (bulk)
router.post('/', createAvailability);

// View own availability
router.get('/', getMyAvailability);

// Update a slot
router.put('/:id', updateAvailability);

// Delete a slot
router.delete('/:id', deleteAvailability);

module.exports = router;
