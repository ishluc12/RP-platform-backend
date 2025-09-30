const router = require('express').Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');

// Import individual admin controllers
const AdminDashboardController = require('../../controllers/admin/adminDashboardController');
const AdminUserController = require('../../controllers/admin/adminUserController');
const AdminEventController = require('../../controllers/admin/adminEventController');
const AdminForumController = require('../../controllers/admin/adminForumController');
const AdminAnalyticsController = require('../../controllers/admin/adminAnalyticsController');
const AdminAnnouncementController = require('../../controllers/admin/adminAnnouncementController');

// Middleware for all admin routes
router.use(authenticateToken);
router.use(requireRoles('admin', 'sys_admin'));

// Admin Dashboard Routes
router.get('/dashboard/summary', AdminDashboardController.getDashboardSummary);
router.get('/dashboard/recent-activity', AdminDashboardController.getRecentActivity);
router.get('/dashboard/top-creators', AdminDashboardController.getTopCreators);
router.get('/dashboard/recent-registrations', AdminDashboardController.getRecentRegistrations);
const express = require('express');
const router = express.Router();

const userRoutes = require('./users');
const eventRoutes = require('./events');
const analyticsRoutes = require('./analytics');
const forumRoutes = require('./forums');
const dashboardRoutes = require('./dashboard');
const surveyRoutes = require('./surveys');
const appointmentRoutes = require('./appointments');

// User Management Routes
router.get('/users', AdminUserController.getAllUsers);
router.get('/users/:id', AdminUserController.getUserById);
router.post('/users', AdminUserController.createUser);
router.put('/users/:id', AdminUserController.updateUser);
router.delete('/users/:id', AdminUserController.deleteUser);

// Event Management Routes
router.get('/events', AdminEventController.getAllEvents);
router.get('/events/:id/stats', AdminEventController.getEventStats);
router.put('/events/:id', AdminEventController.updateEvent);
router.delete('/events/:id', AdminEventController.deleteEvent);

// Forum Management Routes
router.get('/forums', AdminForumController.getAllForums);
router.get('/forums/:id', AdminForumController.getForumById);
router.put('/forums/:id', AdminForumController.updateForum);
router.delete('/forums/:id', AdminForumController.deleteForum);

// Analytics Routes
router.get('/analytics/platform-stats', AdminAnalyticsController.getOverallPlatformStats);
router.get('/analytics/appointment-metrics', AdminAnalyticsController.getAppointmentMetrics);

// Announcement Routes
router.post('/announcements', AdminAnnouncementController.create);
router.get('/announcements', AdminAnnouncementController.list);
router.put('/announcements/:id', AdminAnnouncementController.update);
router.delete('/announcements/:id', AdminAnnouncementController.delete);
// Mount admin routes
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/forums', forumRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/surveys', surveyRoutes);
router.use('/appointments', appointmentRoutes);

module.exports = router;
