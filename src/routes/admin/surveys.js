const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireAdmin } = require('../../middleware/roleAuth');
const {
  adminListSurveys,
  getSurveyTemplateDetails,
  adminAggregateRatings,
  adminGetResponses,
  adminCreateQuestion,
  adminUpdateQuestion,
  adminDeleteQuestion,
  adminCreateOption,
  adminUpdateOption,
  adminDeleteOption,
} = require('../../controllers/shared/surveyController');

router.use(authenticateToken);
router.use(requireAdmin);

// GET /api/admin/surveys/statistics/:templateId - get survey statistics
router.get('/statistics/:templateId', adminAggregateRatings);

// GET /api/admin/surveys/:id/responses - list responses (optionally includeAnswers=true)
router.get('/:id/responses', adminGetResponses);

// POST /api/admin/surveys/templates/:templateId/questions - create question
router.post('/templates/:templateId/questions', adminCreateQuestion);

// PUT /api/admin/surveys/questions/:questionId - update question
router.put('/questions/:questionId', adminUpdateQuestion);

// DELETE /api/admin/surveys/questions/:questionId - delete question
router.delete('/questions/:questionId', adminDeleteQuestion);

// POST /api/admin/surveys/questions/:questionId/options - create option
router.post('/questions/:questionId/options', adminCreateOption);

// PUT /api/admin/surveys/options/:optionId - update option
router.put('/options/:optionId', adminUpdateOption);

// DELETE /api/admin/surveys/options/:optionId - delete option
router.delete('/options/:optionId', adminDeleteOption);

// GET /api/admin/surveys - list survey templates with filters via query
router.get('/', adminListSurveys);

// GET /api/admin/surveys/:id - get survey template details
router.get('/:id', getSurveyTemplateDetails);

module.exports = router;


