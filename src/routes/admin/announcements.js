const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const AdminAnnouncementController = require('../../controllers/admin/adminAnnouncementController');

// Announcement management routes
router.post('/', authenticateToken, requireAdmin, AdminAnnouncementController.create);
router.get('/', authenticateToken, requireAdmin, AdminAnnouncementController.list);
router.put('/:id', authenticateToken, requireAdmin, AdminAnnouncementController.update);
router.delete('/:id', authenticateToken, requireAdmin, AdminAnnouncementController.delete);

module.exports = router;
