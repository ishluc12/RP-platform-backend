const express = require('express');
const router = express.Router();

const userRoutes = require('./users');
const eventRoutes = require('./events');
const analyticsRoutes = require('./analytics');
const forumRoutes = require('./forums');
const dashboardRoutes = require('./dashboard');

// Mount admin routes
router.use('/users', userRoutes);
router.use('/events', eventRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/forums', forumRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
