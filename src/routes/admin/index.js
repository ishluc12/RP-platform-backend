const router = require('express').Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');

// Middleware for all admin routes
router.use(authenticateToken);
router.use(requireRoles('admin', 'administrator', 'sys_admin'));

// Import and mount admin sub-routes
const userRoutes = require('./users');
const eventRoutes = require('./events');
const analyticsRoutes = require('./analytics');
const forumRoutes = require('./forums');
const dashboardRoutes = require('./dashboard');
const surveyRoutes = require('./surveys');
const appointmentRoutes = require('./appointments');
const announcementRoutes = require('./announcements');
const feedManagementRoutes = require('./feedManagement');
const availabilityRoutes = require('./availability');

console.log('✅ Admin routes loaded - dashboard routes:', typeof dashboardRoutes);

// Mount admin routes
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/forums', forumRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/surveys', surveyRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/announcements', announcementRoutes);
router.use('/feed-management', feedManagementRoutes);
router.use('/availability', availabilityRoutes);

console.log('✅ Admin dashboard routes mounted at /dashboard');

module.exports = router;
