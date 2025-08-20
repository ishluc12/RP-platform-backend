const express = require('express');
const router = express.Router();

const AdminUserController = require('../../controllers/admin/adminUserController');
const { authenticateToken } = require('../../middleware/auth');
const {
    requireAdmin,
    requireUserManagementPermission,
    requireBulkOperationPermission,
    requireExportPermission,
    requireAnalyticsPermission
} = require('../../middleware/roleAuth');

// All routes require admin authentication
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users with advanced filtering and pagination
router.get('/', requireUserManagementPermission, AdminUserController.getAllUsers);

// Get user by ID (admin view - full details)
router.get('/:id', requireUserManagementPermission, AdminUserController.getUserById);

// Create new user (admin)
router.post('/', requireUserManagementPermission, AdminUserController.createUser);

// Update user (admin)
router.put('/:id', requireUserManagementPermission, AdminUserController.updateUser);

// Delete user (admin)
router.delete('/:id', requireUserManagementPermission, AdminUserController.deleteUser);

// Bulk update users
router.put('/bulk/update', requireBulkOperationPermission, AdminUserController.bulkUpdateUsers);

// Bulk delete users
router.delete('/bulk/delete', requireBulkOperationPermission, AdminUserController.bulkDeleteUsers);

// Get user statistics and analytics
router.get('/analytics/overview', requireAnalyticsPermission, AdminUserController.getUserAnalytics);

// Export users data
router.get('/export/data', requireExportPermission, AdminUserController.exportUsers);

// Suspend/Activate user
router.put('/:id/status', requireUserManagementPermission, AdminUserController.toggleUserStatus);

// Get user activity logs
router.get('/:id/logs', requireUserManagementPermission, AdminUserController.getUserActivityLogs);

module.exports = router;
