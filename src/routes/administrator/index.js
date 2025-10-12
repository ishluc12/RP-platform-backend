const router = require('express').Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');

// Middleware for all administrator routes
router.use(authenticateToken);
router.use(requireRoles('administrator', 'admin', 'sys_admin'));

// Import and mount administrator sub-routes
const availabilityRoutes = require('./availability');
const appointmentRoutes = require('./appointments');
const dashboardRoutes = require('./dashboard');
const eventRoutes = require('./events');
const exceptionRoutes = require('./exceptions');

// Base route for /api/administrator
router.get('/', (req, res) => {
    res.json({ 
        success: true, 
        message: 'Administrator API', 
        endpoints: ['/appointments', '/availability', '/dashboard', '/events', '/exceptions'] 
    });
});

// Mount administrator routes
router.use('/appointments', appointmentRoutes);
router.use('/availability', availabilityRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/events', eventRoutes);
router.use('/exceptions', exceptionRoutes);

module.exports = router;
