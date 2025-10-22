const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireLecturerOrAdmin } = require('../../middleware/roleAuth');
const LecturerAvailabilityController = require('../../controllers/lecturer/lecturerAvailabilityController');

// All routes require authentication and lecturer/admin role
router.use(authenticateToken);
router.use(requireLecturerOrAdmin);

// Create/update availability slots (bulk)
router.post('/', LecturerAvailabilityController.createAvailability);

// View own availability
router.get('/', LecturerAvailabilityController.listMyAvailability);

// Update a slot
router.put('/:id', LecturerAvailabilityController.updateAvailability);

// Delete a slot
router.delete('/:id', LecturerAvailabilityController.deleteAvailability);

module.exports = router;