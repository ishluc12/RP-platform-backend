const express = require('express');
const router = express.Router();

const appointmentRoutes = require('./appointments');
const eventRoutes = require('./events');
const dashboardRoutes = require('./dashboard');

router.use('/appointments', appointmentRoutes);
router.use('/events', eventRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;

