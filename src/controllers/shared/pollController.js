const Poll = require('../../models/Poll');
const { response, errorResponse } = require('../../utils/responseHandlers');

/**
 * Create a new poll.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createPoll = async (req, res) => {
    const { question, options, expires_at } = req.body;
    const created_by = req.user.id;

    if (!question || !options || !Array.isArray(options) || options.length < 2) {
        return errorResponse(res, 400, 'Poll question and at least two options are required.');
    }

    try {
        const result = await Poll.create({ question, created_by, options, expires_at });
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
    const { created_by, active, page, limit } = req.query;
    const filters = {};
    if (created_by) filters.created_by = parseInt(created_by);
    if (active !== undefined) filters.active = active === 'true';

    try {
        const result = await Poll.getAll({ ...filters, page: parseInt(page), limit: parseInt(limit) });
        if (!result.success) return errorResponse(res, 400, result.error);
        response(res, 200, 'Polls fetched successfully', result.data);
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
        const result = await Poll.getById(parseInt(id));
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
        const result = await Poll.vote({ poll_option_id: parseInt(pollOptionId), user_id: userId });
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
