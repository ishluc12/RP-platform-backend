const express = require('express');
const router = express.Router();
const StudentFeedbackController = require('../../controllers/student/studentFeedbackController');
const { authenticateToken } = require('../../middleware/auth');
const { requireRoles } = require('../../middleware/roleAuth');

// Apply authentication and role middleware to all routes
router.use(authenticateToken);
router.use(requireRoles('student'));

// Student feedback routes
/**
 * @route POST /api/student/feedback
 * @desc Submit new feedback
 * @access Private (Student only)
 */
router.post('/', StudentFeedbackController.submitFeedback);

/**
 * @route GET /api/student/feedback/history
 * @desc Get student's feedback history
 * @access Private (Student only)
 */
router.get('/history', StudentFeedbackController.getFeedbackHistory);

/**
 * @route GET /api/student/feedback/:id
 * @desc Get feedback by ID
 * @access Private (Student only - owner only)
 */
router.get('/:id', StudentFeedbackController.getFeedbackById);

/**
 * @route PUT /api/student/feedback/:id
 * @desc Update feedback (only if status is open)
 * @access Private (Student only - owner only)
 */
router.put('/:id', StudentFeedbackController.updateFeedback);

module.exports = router;