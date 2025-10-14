const express = require('express');
const router = express.Router();
const AdminDashboardController = require('../../controllers/admin/adminDashboardController');

// Dashboard routes (auth middleware already applied in parent router)
router.get('/summary', AdminDashboardController.getDashboardSummary);
router.get('/recent-activity', AdminDashboardController.getRecentActivity);
router.get('/recent-appointments', AdminDashboardController.getRecentAppointments);
router.get('/top-creators', AdminDashboardController.getTopCreators);
router.get('/recent-registrations', AdminDashboardController.getRecentRegistrations);

module.exports = router;
