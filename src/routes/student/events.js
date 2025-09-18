const express = require('express');
const router = express.Router();
const StudentEventController = require('../../controllers/student/studentEventController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');

// Apply authentication and role middleware to all routes
router.use(authenticateToken);
router.use(requireRoles('student', 'lecturer', 'admin', 'sys_admin'));

// Student event routes (read-only access)
router.get('/', StudentEventController.getAllEvents);
router.get('/upcoming', StudentEventController.getUpcomingEvents);
router.get('/past', StudentEventController.getPastEvents);
router.get('/search', StudentEventController.searchEvents);
router.get('/creator/:userId', StudentEventController.getEventsByCreator);
router.get('/department/:department', StudentEventController.getEventsByDepartment);
router.get('/today', StudentEventController.getTodayEvents);
router.get('/this-week', StudentEventController.getThisWeekEvents);
router.get('/this-month', StudentEventController.getThisMonthEvents);
router.get('/:id', StudentEventController.getEventById);
router.get('/with-participant-counts', StudentEventController.getEventsWithParticipantCounts);

// RSVP functionality for students
router.post('/:id/rsvp', StudentEventController.rsvpToEvent);
router.delete('/:id/rsvp', StudentEventController.removeRsvp);
router.get('/:id/participants', StudentEventController.getEventParticipants);
router.get('/:id/rsvp-status', StudentEventController.getUserRsvpStatus);
router.get('/:id/stats', StudentEventController.getEventStats);
router.get('/rsvp/events', StudentEventController.getUserRsvpEvents);

module.exports = router;
