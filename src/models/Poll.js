const { supabase } = require('../config/database');

class Poll {
    /**
     * Create a new poll
     * @param {Object} params
     * @param {string} params.question
     * @param {string} params.created_by
     * @param {Array<string>} params.options - Array of poll option texts
     * @param {string} [params.expires_at]
     * @returns {Promise<Object>}
     */
    static async create({ question, created_by, options, expires_at = null }) {
        try {
            const { data: poll, error: pollError } = await supabase
                .from('polls')
                .insert([{ question, created_by, expires_at }])
                .select('id')
                .single();

            if (pollError) throw pollError;

            const pollId = poll.id;
            const optionInserts = options.map(option_text => ({ poll_id: pollId, option_text }));

            const { data: pollOptions, error: optionsError } = await supabase
                .from('poll_options')
                .insert(optionInserts)
                .select('*');

            if (optionsError) throw optionsError;

            return { success: true, data: { ...poll, options: pollOptions } };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get a poll by ID with its options and current vote counts
     * @param {string} pollId
     * @returns {Promise<Object>}
     */
    static async getById(pollId) {
        try {
            const { data: poll, error: pollError } = await supabase
                .from('polls')
                .select(`
                    *,
                    poll_options (id, option_text, poll_votes(count))
                `)
                .eq('id', pollId)
                .single();

            if (pollError) throw pollError;

            // Flatten vote counts
            const formattedPoll = {
                ...poll,
                poll_options: poll.poll_options.map(option => ({
                    ...option,
                    votes_count: option.poll_votes[0]?.count || 0
                }))
            };

            return { success: true, data: formattedPoll };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Record a vote for a poll option
     * @param {Object} params
     * @param {string} params.poll_option_id
     * @param {string} params.user_id
     * @returns {Promise<Object>}
     */
    static async vote({ poll_option_id, user_id }) {
        try {
            // Check if user has already voted in this poll
            const { data: existingVote, error: checkError } = await supabase
                .from('poll_votes')
                .select('id')
                .eq('user_id', user_id)
                .in('poll_option_id', supabase.from('poll_options').select('id').eq('poll_id',
                    supabase.from('poll_options').select('poll_id').eq('id', poll_option_id).single().data.poll_id
                ));

            if (checkError) throw checkError;
            if (existingVote && existingVote.length > 0) {
                return { success: false, error: 'User has already voted in this poll' };
            }

            const { data, error } = await supabase
                .from('poll_votes')
                .insert([{ poll_option_id, user_id }])
                .select('*')
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    /**
     * Get all polls, optionally filtered by creator or active status
     * @param {Object} [filters={}]
     * @param {string} [filters.created_by]
     * @param {boolean} [filters.active=true] - Only return polls that have not expired
     * @param {number} [options.page=1]
     * @param {number} [options.limit=10]
     * @returns {Promise<Object>}
     */
    static async getAll({ created_by, active = true, page = 1, limit = 10 } = {}) {
        try {
            let query = supabase
                .from('polls')
                .select(`
                    *,
                    poll_options (id, option_text, poll_votes(count))
                `);

            if (created_by) {
                query = query.eq('created_by', created_by);
            }

            if (active) {
                query = query.gte('expires_at', new Date().toISOString());
            }

            const from = (page - 1) * limit;
            const to = from + limit - 1;
            query = query.range(from, to);

            const { data: polls, error } = await query;

            if (error) throw error;

            const formattedPolls = polls.map(poll => ({
                ...poll,
                poll_options: poll.poll_options.map(option => ({
                    ...option,
                    votes_count: option.poll_votes[0]?.count || 0
                }))
            }));

            return { success: true, data: formattedPolls };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

module.exports = Poll;
