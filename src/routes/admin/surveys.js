const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const { adminGetSurveys, adminGetSurveyDetails, adminGetAggregates } = require('../../controllers/shared/surveyController');

router.use(authenticateToken);
router.use(requireAdmin());

// GET /api/admin/surveys - list with filters via query
router.get('/', adminGetSurveys);

// GET /api/admin/surveys/:id - details
router.get('/:id', adminGetSurveyDetails);

// GET /api/admin/surveys/aggregates/ratings - aggregates per filters
router.get('/aggregates/ratings', adminGetAggregates);

module.exports = router;


