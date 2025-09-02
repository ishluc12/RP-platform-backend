const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const surveyController = require('../../controllers/shared/surveyController');
// const multer = require('multer'); // Temporarily comment out as attachment functionality is deferred
// const fs = require('fs');
// const path = require('path');

router.use(authenticateToken);

// --- Public/Student Survey Routes ---

// Create a new survey (for student to fill out initially, or admin for broadcast)
router.post('/', surveyController.createSurvey);

// Get a specific survey with details
router.get('/:id', surveyController.getSurveyDetails);

// List surveys for the authenticated student
router.get('/student-list', surveyController.listStudentSurveys);

// Update a survey (student or admin)
router.put('/:id', surveyController.updateSurvey);

// Delete a survey (student or admin)
router.delete('/:id', surveyController.deleteSurvey);

// Submit/Update survey response (ratings and comments)
router.post('/:id/response', surveyController.submitSurveyResponse);

// --- Admin Survey Routes (require additional role-based authorization in controller) ---

// Admin: List surveys with filters
router.get('/admin/list', surveyController.adminListSurveys);

// Admin: Aggregate ratings for surveys
router.get('/admin/aggregates', surveyController.adminAggregateRatings);

// --- Attachment Upload (Deferred) ---
// const storage = multer.diskStorage({
//     destination: (req, file, cb) => {
//         const uploadDir = path.join('uploads', 'surveys');
//         if (!fs.existsSync(uploadDir)) {
//             fs.mkdirSync(uploadDir, { recursive: true });
//         }
//         cb(null, uploadDir);
//     },
//     filename: (req, file, cb) => {
//         const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
//         cb(null, 'survey-' + uniqueSuffix + path.extname(file.originalname));
//     }
// });
// const fileFilter = (req, file, cb) => {
//     const allowed = ['application/pdf', 'image/', 'text/plain', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
//     if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/') || allowed.includes(file.mimetype)) {
//         return cb(null, true);
//     }
//     return cb(new Error('Unsupported file type'), false);
// };
// const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });
// router.post('/:id/attachments', upload.single('file'), surveyController.uploadSurveyAttachment); // Assuming this will be a method in surveyController

module.exports = router;


