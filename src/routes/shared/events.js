const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const eventController = require('../../controllers/shared/eventController');
// const { validateEvent } = require('../../middleware/validation'); // Temporarily remove if not defined

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Event CRUD operations
router.post('/', eventController.createEvent);
router.get('/', eventController.getAllEvents); // Covers upcoming, past, search with filters
router.get('/:id', eventController.getEventById);
router.put('/:id', eventController.updateEvent);
router.delete('/:id', eventController.deleteEvent);

// RSVP and participant management
router.post('/:eventId/rsvp', eventController.rsvpToEvent);
router.delete('/:eventId/rsvp', eventController.removeRsvp);
router.get('/:eventId/participants', eventController.getEventParticipants);
router.get('/:eventId/rsvp-status', eventController.getUserRsvpStatus);
router.get('/user-rsvps', eventController.getUserRsvpEvents);

// Future additions:
// router.get('/:eventId/stats', eventController.getEventStats); // Requires DB function

module.exports = router;
