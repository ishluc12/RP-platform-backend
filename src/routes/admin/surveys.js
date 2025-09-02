const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const { adminListSurveys, getSurveyDetails, adminAggregateRatings } = require('../../controllers/shared/surveyController');

router.use(authenticateToken);
router.use(requireAdmin); // requireAdmin should be passed directly if it's middleware

// GET /api/admin/surveys - list with filters via query
router.get('/', adminListSurveys);

// GET /api/admin/surveys/:id - details
router.get('/:id', getSurveyDetails); // Admin can view any survey details

// GET /api/admin/surveys/aggregates - aggregates per filters
router.get('/aggregates', adminAggregateRatings);

module.exports = router;


