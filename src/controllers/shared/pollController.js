const Poll = require('../../models/Poll');
const { response, errorResponse } = require('../../utils/responseHandlers');

/**
 * Create a new poll.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createPoll = async (req, res) => {
    const { question, options, expires_at, target_audience, is_active } = req.body;
    const created_by = req.user.id;

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
        return errorResponse(res, 400, 'Poll question and at least two options are required.');
    }

    // Validate target_audience
    const validAudiences = [
        'all',
        'Civil Engineering',
        'Creative Arts',
        'Mechanical Engineering',
        'Electrical & Electronics Engineering',
        'Information & Communication Technology (ICT)',
        'Mining Engineering',
        'Transport and Logistics'
    ];

    if (target_audience && !validAudiences.includes(target_audience)) {
        return errorResponse(res, 400, `Invalid target_audience. Must be one of: ${validAudiences.join(', ')}`);
    }

    try {
        const result = await Poll.create({ 
            question, 
            created_by, 
            options, 
            expires_at, 
            target_audience: target_audience || 'all',
            is_active: is_active !== undefined ? is_active : true
        });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 201, 'Poll created successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get all polls.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getAllPolls = async (req, res) => {
    const { created_by, active, page = 1, limit = 50 } = req.query;
    const filters = {};
    
    if (created_by) filters.created_by = created_by;
    if (active !== undefined) filters.active = active === 'true';
    
    // Get user information
    const userDepartment = req.user?.department;
    const userRole = req.user?.role;
    
    // Pass user role to model for role-based filtering
    filters.user_role = userRole;
    
    // Only apply department filtering for students
    // Admins/lecturers will see all polls regardless of department
    if (userRole === 'student' && userDepartment) {
        filters.user_department = userDepartment;
    }

    try {
        const result = await Poll.getAll({ 
            ...filters, 
            page: parseInt(page), 
            limit: parseInt(limit) 
        });
        if (!result.success) return errorResponse(res, 400, result.error);
        
        // Return all polls (both active and expired) if active filter is not specified
        response(res, 200, 'Polls fetched successfully', result.data, result.pagination);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get a poll by ID.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getPollById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Poll.getById(id);
        if (!result.success) return errorResponse(res, 404, result.error);
        response(res, 200, 'Poll fetched successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Vote on a poll option.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const voteOnPoll = async (req, res) => {
    const { pollOptionId } = req.body;
    const userId = req.user.id; // Authenticated user

    if (!pollOptionId) {
        return errorResponse(res, 400, 'Poll option ID is required.');
    }

    try {
        const result = await Poll.vote({ poll_option_id: pollOptionId, user_id: userId });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Vote cast successfully', result.data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

module.exports = {
    createPoll,
    getAllPolls,
    getPollById,
    voteOnPoll
};
