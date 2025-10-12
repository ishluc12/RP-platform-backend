const router = require('express').Router();
const LecturerAvailabilityController = require('../../controllers/lecturer/lecturerAvailabilityController');

// Get all active lecturer and administrator availability (publicly accessible for students)
router.get('/', LecturerAvailabilityController.getLecturerAvailabilityForStudents);

module.exports = router;
