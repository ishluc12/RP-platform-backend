const router = require('express').Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');

const userRoutes = require('./users');
const postRoutes = require('./posts');
const eventRoutes = require('./events');
const analyticsRoutes = require('./analytics');
const forumRoutes = require('./forums');
const dashboardRoutes = require('./dashboard');
const surveyRoutes = require('./surveys');
const appointmentRoutes = require('./appointments');
const announcementRoutes = require('./announcements');
const feedManagementRoutes = require('./feedManagement');
const availabilityRoutes = require('./availability');
const pollRoutes = require('./polls');

console.log('✅ Admin routes loaded - dashboard routes:', typeof dashboardRoutes);

// Mount admin routes
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/events', eventRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/forums', forumRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/surveys', surveyRoutes);
router.use('/appointments', appointmentRoutes);
router.use('/announcements', announcementRoutes);
router.use('/feed-management', feedManagementRoutes);
router.use('/availability', availabilityRoutes);
router.use('/polls', pollRoutes);

console.log('✅ Admin dashboard routes mounted at /dashboard');

module.exports = router;