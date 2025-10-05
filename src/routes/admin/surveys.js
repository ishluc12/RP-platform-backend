const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const { adminListSurveys, getSurveyTemplateDetails, adminAggregateRatings } = require('../../controllers/shared/surveyController');

router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/surveys - list survey templates with filters via query
router.get('/', adminListSurveys);

// GET /api/admin/surveys/:id - get survey template details
router.get('/:id', getSurveyTemplateDetails);

// GET /api/admin/surveys/statistics/:templateId - get survey statistics
router.get('/statistics/:templateId', adminAggregateRatings);

module.exports = router;


