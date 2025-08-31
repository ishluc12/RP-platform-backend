const express = require('express');
const router = express.Router();
const AdminEventController = require('../../controllers/admin/adminEventController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRole } = require('../../middleware/roleAuth');
const { validateEventUpdate } = require('../../middleware/validation');

// Apply authentication and role middleware to all routes
router.use(authenticateToken);
router.use(requireRole(['admin', 'sys_admin']));

// Admin event management routes
router.get('/', AdminEventController.getAllEvents);
router.get('/stats', AdminEventController.getEventStats);
router.get('/advanced-filters', AdminEventController.getEventsWithAdvancedFilters);
router.get('/user/:userId', AdminEventController.getEventsByUser);
router.put('/:id', validateEventUpdate, AdminEventController.updateEvent);
router.delete('/:id', AdminEventController.deleteEvent);
router.delete('/bulk', AdminEventController.bulkDeleteEvents);

module.exports = router;
