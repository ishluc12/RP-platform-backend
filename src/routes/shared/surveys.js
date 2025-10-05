const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const surveyController = require('../../controllers/shared/surveyController');

router.use(authenticateToken);

// --- Survey Template Management Routes ---

// Create a new survey template
router.post('/', surveyController.createSurveyTemplate);

// Get a specific survey template with questions and options
router.get('/:id', surveyController.getSurveyTemplateDetails);

// List survey templates
router.get('/', surveyController.listSurveyTemplates);

// Update a survey template
router.put('/:id', surveyController.updateSurveyTemplate);

// Delete a survey template
router.delete('/:id', surveyController.deleteSurveyTemplate);

// --- Survey Response Routes ---

// Create a new survey response
router.post('/:id/responses', surveyController.createResponse);

// Submit survey answers for a template
router.post('/:id/response', surveyController.submitSurveyResponse);

// --- Admin Survey Routes ---

// Admin: List survey templates with filters
router.get('/admin/list', surveyController.adminListSurveys);

// Admin: Get survey statistics for a template
router.get('/admin/statistics/:templateId', surveyController.adminAggregateRatings);

module.exports = router;


