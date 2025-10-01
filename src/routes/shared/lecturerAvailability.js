const router = require('express').Router();
const { getLecturerAvailabilityForStudents } = require('../../controllers/lecturer/lecturerAvailabilityController');

// Get all active lecturer availability (publicly accessible for students)
router.get('/', getLecturerAvailabilityForStudents);

module.exports = router;
