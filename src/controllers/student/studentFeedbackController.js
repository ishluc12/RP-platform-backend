const { supabase } = require('../../config/database');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class StudentFeedbackController {
    /**
     * Submit new feedback from student
     */
    static async submitFeedback(req, res) {
        try {
            const studentId = req.user.id;
            const { 
                type = 'general', 
                subject, 
                message, 
                category = 'general',
                priority = 'medium',
                anonymous = false
            } = req.body;

            // Validate required fields
            if (!subject || !message) {
                return errorResponse(res, 400, 'Subject and message are required');
            }

            // Insert feedback into database
            const { data, error } = await supabase
                .from('feedback')
                .insert([{
                    user_id: anonymous ? null : studentId,
                    type: type,
                    subject: subject.trim(),
                    message: message.trim(),
                    category: category,
                    priority: priority,
                    status: 'open',
                    anonymous: anonymous,
                    submitted_at: new Date().toISOString()
                }])
                .select('*')
                .single();

            if (error) {
                logger.error('Error creating feedback:', error);
                return errorResponse(res, 500, 'Failed to submit feedback');
            }

            logger.info(`Feedback submitted by student ${studentId}: ${subject}`);
            response(res, 201, 'Feedback submitted successfully', data);
        } catch (error) {
            logger.error('Error in feedback submission:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Get feedback history for current student
     */
    static async getFeedbackHistory(req, res) {
        try {
            const studentId = req.user.id;

            const { data, error } = await supabase
                .from('feedback')
                .select('*')
                .eq('user_id', studentId)
                .order('submitted_at', { ascending: false });

            if (error) {
                logger.error('Error fetching feedback history:', error);
                return errorResponse(res, 500, 'Failed to fetch feedback history');
            }

            response(res, 200, 'Feedback history fetched successfully', data || []);
        } catch (error) {
            logger.error('Error in getting feedback history:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Get specific feedback by ID (only if owned by student)
     */
    static async getFeedbackById(req, res) {
        try {
            const { id } = req.params;
            const studentId = req.user.id;

            const { data, error } = await supabase
                .from('feedback')
                .select('*')
                .eq('id', id)
                .single();

            if (error) {
                logger.error('Error fetching feedback:', error);
                return errorResponse(res, 500, 'Failed to fetch feedback');
            }

            if (!data) {
                return errorResponse(res, 404, 'Feedback not found');
            }

            // Check if student owns this feedback
            if (data.user_id !== studentId) {
                return errorResponse(res, 403, 'Access denied');
            }

            response(res, 200, 'Feedback fetched successfully', data);
        } catch (error) {
            logger.error('Error in getting feedback by ID:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Update feedback (only subject and message can be updated, and only if status is open)
     */
    static async updateFeedback(req, res) {
        try {
            const { id } = req.params;
            const studentId = req.user.id;
            const { subject, message } = req.body;

            // Validate required fields
            if (!subject && !message) {
                return errorResponse(res, 400, 'Subject or message is required');
            }

            // Get existing feedback to verify ownership and status
            const { data: existingFeedback, error: fetchError } = await supabase
                .from('feedback')
                .select('*')
                .eq('id', id)
                .single();

            if (fetchError) {
                logger.error('Error fetching feedback:', fetchError);
                return errorResponse(res, 500, 'Failed to fetch feedback');
            }

            if (!existingFeedback) {
                return errorResponse(res, 404, 'Feedback not found');
            }

            // Check if student owns this feedback
            if (existingFeedback.user_id !== studentId) {
                return errorResponse(res, 403, 'Access denied');
            }

            // Check if feedback can still be updated (only when status is open)
            if (existingFeedback.status !== 'open') {
                return errorResponse(res, 400, 'Cannot update feedback that is not open');
            }

            // Prepare update data
            const updateData = {};
            if (subject) updateData.subject = subject.trim();
            if (message) updateData.message = message.trim();
            updateData.updated_at = new Date().toISOString();

            // Update feedback in database
            const { data, error } = await supabase
                .from('feedback')
                .update(updateData)
                .eq('id', id)
                .select('*')
                .single();

            if (error) {
                logger.error('Error updating feedback:', error);
                return errorResponse(res, 500, 'Failed to update feedback');
            }

            response(res, 200, 'Feedback updated successfully', data);
        } catch (error) {
            logger.error('Error in updating feedback:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }
}

module.exports = StudentFeedbackController;