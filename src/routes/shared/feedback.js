const express = require('express');
const router = express.Router();
const FeedbackController = require('../../controllers/shared/feedbackController');
const { authenticateToken } = require('../../middleware/auth');

/**
 * @route POST /api/shared/feedback
 * @desc Submit new feedback
 * @access Private (requires authentication)
 */
router.post('/', authenticateToken, FeedbackController.submit);

/**
 * @route GET /api/shared/feedback/history
 * @desc Get user's feedback history
 * @access Private (requires authentication)
 */
router.get('/history', authenticateToken, FeedbackController.getHistory);

/**
 * @route GET /api/shared/feedback
 * @desc List all feedback (admin only)
 * @access Private (admin/sys-admin only)
 */
router.get('/', authenticateToken, FeedbackController.list);

/**
 * @route GET /api/shared/feedback/:id
 * @desc Get feedback by ID
 * @access Private (owner or admin)
 */
router.get('/:id', authenticateToken, FeedbackController.getById);

module.exports = router;