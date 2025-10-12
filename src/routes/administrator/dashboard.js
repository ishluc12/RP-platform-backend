const express = require('express');
const router = express.Router();
const AdministratorDashboardController = require('../../controllers/administrator/administratorDashboardController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');

const ADMIN_ROLES = ['administrator', 'admin', 'sys_admin'];

router.use(authenticateToken);
router.use(requireRoles(ADMIN_ROLES));

// Get a summary of key metrics for the administrator dashboard
router.get('/summary', AdministratorDashboardController.getDashboardSummary);

// Get a list of recent and upcoming appointments for the administrator
router.get('/recent-appointments', AdministratorDashboardController.getRecentAppointments);

// Get a list of students the administrator has recently interacted with
router.get('/recent-students', AdministratorDashboardController.getRecentStudents);

module.exports = router;
