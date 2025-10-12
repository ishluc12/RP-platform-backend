const express = require('express');
const router = express.Router();
const AdministratorEventController = require('../../controllers/administrator/administratorEventController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');

const ADMIN_ROLES = ['administrator', 'admin', 'sys_admin'];

// Apply authentication and role middleware to all routes
router.use(authenticateToken);
router.use(requireRoles(ADMIN_ROLES));

// Administrator event management routes
router.post('/', AdministratorEventController.createEvent);
router.get('/my-events', AdministratorEventController.getMyEvents);
router.get('/upcoming', AdministratorEventController.getUpcomingEvents);
router.get('/past', AdministratorEventController.getPastEvents);
router.get('/search', AdministratorEventController.searchEvents);
router.get('/stats', AdministratorEventController.getAdministratorEventStats); // Overall administrator event stats
router.get('/stats/:id', AdministratorEventController.getAdministratorEventStats); // Specific event stats for administrator
router.get('/:id', AdministratorEventController.getEventById);
router.put('/:id', AdministratorEventController.updateEvent);
router.delete('/:id', AdministratorEventController.deleteEvent);

// Event participant routes
router.get('/:id/participants', AdministratorEventController.getEventParticipants);

module.exports = router;
