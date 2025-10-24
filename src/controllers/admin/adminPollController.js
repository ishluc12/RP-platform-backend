const Poll = require('../../models/Poll');
const { supabase } = require('../../config/database');
const { response, errorResponse } = require('../../utils/responseHandlers');

/**
 * Get all polls (admin view) - shows all polls regardless of expiration
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getAllPolls = async (req, res) => {
    try {
        // For admin, we want all polls regardless of active status
        const result = await Poll.getAll({ active: false });
        if (!result.success) return errorResponse(res, 400, result.error);
        
        // Enhance poll data with additional information for admin view
        const enhancedPolls = result.data.map(poll => {
            const totalVotes = poll.poll_options.reduce((sum, option) => sum + (option.votes_count || 0), 0);
            const isActive = !poll.expires_at || new Date(poll.expires_at) > new Date();
            
            return {
                ...poll,
                total_votes: totalVotes,
                is_active: isActive
            };
        });
        
        response(res, 200, 'Polls fetched successfully', enhancedPolls);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get a specific poll by ID with full details (admin view)
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getPollById = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Poll.getById(id);
        if (!result.success) return errorResponse(res, 404, result.error);
        
        // Enhance poll data with additional information
        const poll = result.data;
        const totalVotes = poll.poll_options.reduce((sum, option) => sum + (option.votes_count || 0), 0);
        const isActive = !poll.expires_at || new Date(poll.expires_at) > new Date();
        
        const enhancedPoll = {
            ...poll,
            total_votes: totalVotes,
            is_active: isActive
        };
        
        response(res, 200, 'Poll fetched successfully', enhancedPoll);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Create a new poll (admin only)
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
 * Update a poll (admin only)
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updatePoll = async (req, res) => {
    const { id } = req.params;
    const { question, options, expires_at } = req.body;

    try {
        // First get the existing poll to verify it exists
        const existingPoll = await Poll.getById(id);
        if (!existingPoll.success) return errorResponse(res, 404, 'Poll not found');

        // For now, we'll only update the basic poll information
        // In a more advanced implementation, we might handle option updates separately
        const { data, error } = await supabase
            .from('polls')
            .update({ question, expires_at })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;
        
        response(res, 200, 'Poll updated successfully', data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Delete a poll (admin only)
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const deletePoll = async (req, res) => {
    const { id } = req.params;

    try {
        // First verify the poll exists
        const existingPoll = await Poll.getById(id);
        if (!existingPoll.success) return errorResponse(res, 404, 'Poll not found');

        // Delete the poll (cascading will handle options and votes)
        const { data, error } = await supabase
            .from('polls')
            .delete()
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        response(res, 200, 'Poll deleted successfully', data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Update poll status (activate/deactivate)
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updatePollStatus = async (req, res) => {
    const { id } = req.params;
    const { is_active } = req.body;

    try {
        // Get current poll to check if it exists
        const existingPoll = await Poll.getById(id);
        if (!existingPoll.success) return errorResponse(res, 404, 'Poll not found');

        // Update expiration date based on active status
        // If setting to active, remove expiration (set to null for no expiration)
        // If setting to inactive, set expiration to now
        const expires_at = is_active ? null : new Date().toISOString();
        
        const { data, error } = await supabase
            .from('polls')
            .update({ expires_at })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        response(res, 200, 'Poll status updated successfully', { ...data, is_active });
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

module.exports = {
    getAllPolls,
    getPollById,
    createPoll,
    updatePoll,
    deletePoll,
    updatePollStatus
};