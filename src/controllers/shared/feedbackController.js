const { supabase } = require('../../config/database');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');

class FeedbackController {
    /**
     * Submit new feedback
     */
    static async submit(req, res) {
        try {
            const userId = req.user?.id;
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
                    user_id: anonymous ? null : userId,
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

            logger.info(`Feedback submitted by user ${userId}: ${subject}`);
            response(res, 201, 'Feedback submitted successfully', data);
        } catch (error) {
            logger.error('Error in feedback submission:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Get feedback history for current user
     */
    static async getHistory(req, res) {
        try {
            const userId = req.user?.id;

            if (!userId) {
                return errorResponse(res, 401, 'Authentication required');
            }

            const { data, error } = await supabase
                .from('feedback')
                .select('*')
                .eq('user_id', userId)
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
     * List all feedback (for admin/sys-admin)
     */
    static async list(req, res) {
        try {
            const userRole = req.user?.role;

            // Only allow admin and sys_admin to view all feedback
            if (!['administrator', 'admin', 'sys_admin'].includes(userRole)) {
                return errorResponse(res, 403, 'Access denied. Admin privileges required.');
            }

            const { 
                page = 1, 
                limit = 20, 
                status, 
                type, 
                category,
                priority 
            } = req.query;

            let query = supabase
                .from('feedback')
                .select('*');

            // Apply filters
            if (status) {
                query = query.eq('status', status);
            }
            if (type) {
                query = query.eq('type', type);
            }
            if (category) {
                query = query.eq('category', category);
            }
            if (priority) {
                query = query.eq('priority', priority);
            }

            // Apply pagination
            const offset = (page - 1) * limit;
            query = query
                .order('submitted_at', { ascending: false })
                .range(offset, offset + limit - 1);

            const { data, error } = await query;

            if (error) {
                logger.error('Error fetching feedback list:', error);
                return errorResponse(res, 500, 'Failed to fetch feedback list');
            }

            response(res, 200, 'Feedback list fetched successfully', {
                feedback: data || [],
                pagination: {
                    page: parseInt(page),
                    limit: parseInt(limit),
                    total: data?.length || 0
                }
            });
        } catch (error) {
            logger.error('Error in listing feedback:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }

    /**
     * Get feedback by ID
     */
    static async getById(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user?.id;
            const userRole = req.user?.role;

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

            // Check permissions - user can view their own, admin can view all
            const isOwner = data.user_id === userId;
            const isAdmin = ['administrator', 'admin', 'sys_admin'].includes(userRole);

            if (!isOwner && !isAdmin) {
                return errorResponse(res, 403, 'Access denied');
            }

            response(res, 200, 'Feedback fetched successfully', data);
        } catch (error) {
            logger.error('Error in getting feedback by ID:', error);
            errorResponse(res, 500, 'Internal server error');
        }
    }
}

module.exports = FeedbackController;