const express = require('express');
const router = express.Router();
const EventController = require('../../controllers/shared/eventController');
const { authenticateToken } = require('../../middleware/auth');
const { validateEvent } = require('../../middleware/validation');

// Apply authentication middleware to all routes
router.use(authenticateToken);

// Event CRUD operations
router.post('/', validateEvent, EventController.createEvent);
router.get('/', EventController.getAllEvents);
router.get('/upcoming', EventController.getUpcomingEvents);
router.get('/past', EventController.getPastEvents);
router.get('/search', EventController.searchEvents);
router.get('/my-events', EventController.getMyEvents);
router.get('/creator/:userId', EventController.getEventsByCreator);
router.get('/:id', EventController.getEventById);
router.put('/:id', validateEvent, EventController.updateEvent);
router.delete('/:id', EventController.deleteEvent);

// RSVP and participant management
router.post('/:id/rsvp', EventController.rsvpToEvent);
router.delete('/:id/rsvp', EventController.removeRsvp);
router.get('/:id/participants', EventController.getEventParticipants);
router.get('/:id/rsvp-status', EventController.getUserRsvpStatus);
router.get('/:id/stats', EventController.getEventStats);
router.get('/rsvp/events', EventController.getUserRsvpEvents);

module.exports = router;
