const router = require('express').Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');

// Middleware for all administrator routes
router.use(authenticateToken);
router.use(requireRoles('administrator', 'admin', 'sys_admin'));

// Import and mount administrator sub-routes
const availabilityRoutes = require('./availability');
const appointmentRoutes = require('./appointments');
const dashboardRoutes = require('../admin/dashboard'); // Reuse admin dashboard

// Mount administrator routes
router.use('/availability', availabilityRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
