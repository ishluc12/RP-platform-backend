const router = require('express').Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');

// Middleware for all admin routes
router.use(authenticateToken);
router.use(requireRoles('admin', 'sys_admin'));

// Import and mount admin sub-routes
const userRoutes = require('./users');
const eventRoutes = require('./events');
const analyticsRoutes = require('./analytics');
const forumRoutes = require('./forums');
const dashboardRoutes = require('./dashboard');
const surveyRoutes = require('./surveys');
const appointmentRoutes = require('./appointments');
const announcementRoutes = require('./announcements');

// Mount admin routes
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/forums', forumRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/surveys', surveyRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/announcements', announcementRoutes);

module.exports = router;
