const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const AdminEventController = require('../../controllers/admin/adminEventController');

// Event management routes
router.get('/', authenticateToken, requireAdmin, AdminEventController.getAllEvents);
router.get('/stats', authenticateToken, requireAdmin, AdminEventController.getEventStats);
router.get('/stats/:id', authenticateToken, requireAdmin, AdminEventController.getEventStats);
router.get('/advanced-filters', authenticateToken, requireAdmin, AdminEventController.getEventsWithAdvancedFilters);
router.get('/user/:userId', authenticateToken, requireAdmin, AdminEventController.getEventsByUser);
router.put('/:id', authenticateToken, requireAdmin, AdminEventController.updateEvent);
router.delete('/:id', authenticateToken, requireAdmin, AdminEventController.deleteEvent);
router.delete('/bulk', authenticateToken, requireAdmin, AdminEventController.bulkDeleteEvents);

module.exports = router;
