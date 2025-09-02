const express = require('express');
const router = express.Router();
const LecturerEventController = require('../../controllers/lecturer/lecturerEventController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleAuth');
// const { validateEvent, validateEventUpdate } = require('../../middleware/validation'); // Removed for now

// Apply authentication and role middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['lecturer', 'admin', 'sys_admin']));

// Lecturer event management routes
router.post('/', LecturerEventController.createEvent);
router.get('/my-events', LecturerEventController.getMyEvents);
router.get('/upcoming', LecturerEventController.getUpcomingEvents);
router.get('/past', LecturerEventController.getPastEvents);
router.get('/search', LecturerEventController.searchEvents);
router.get('/stats', LecturerEventController.getLecturerEventStats); // Overall lecturer event stats
router.get('/stats/:id', LecturerEventController.getLecturerEventStats); // Specific event stats for lecturer
router.get('/:id', LecturerEventController.getEventById);
router.put('/:id', LecturerEventController.updateEvent);
router.delete('/:id', LecturerEventController.deleteEvent);

// Event participant routes
router.get('/:id/participants', LecturerEventController.getEventParticipants);

module.exports = router;
