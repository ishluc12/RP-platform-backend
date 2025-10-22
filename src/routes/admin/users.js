const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const AdminUserController = require('../../controllers/admin/adminUserController');

// User management routes - specific routes first, then parameterized routes
router.put('/bulk/update', authenticateToken, requireAdmin, AdminUserController.bulkUpdateUsers);
router.delete('/bulk/delete', authenticateToken, requireAdmin, AdminUserController.bulkDeleteUsers);
router.get('/analytics/overview', authenticateToken, requireAdmin, AdminUserController.getUserAnalytics);
router.get('/export/data', authenticateToken, requireAdmin, AdminUserController.exportUsers);
router.get('/', authenticateToken, requireAdmin, AdminUserController.getAllUsers);
router.post('/', authenticateToken, requireAdmin, AdminUserController.createUser);
router.get('/:id', authenticateToken, requireAdmin, AdminUserController.getUserById);
router.put('/:id', authenticateToken, requireAdmin, AdminUserController.updateUser);
router.delete('/:id', authenticateToken, requireAdmin, AdminUserController.deleteUser);
router.put('/:id/status', authenticateToken, requireAdmin, AdminUserController.toggleUserStatus);
router.get('/:id/logs', authenticateToken, requireAdmin, AdminUserController.getUserActivityLogs);

module.exports = router;
