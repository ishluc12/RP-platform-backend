const { supabase, supabaseAdmin } = require('../config/database');
const db = supabaseAdmin || supabase;

// Create a survey template
const createSurveyTemplate = async (templateData) => {
    const { data, error } = await db
        .from('survey_templates')
        .insert(templateData)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// Get a survey template with questions and options (initially, without responses)
const getSurveyTemplateDetails = async (templateId) => {
    const { data: template, error: tErr } = await db
        .from('survey_templates')
        .select('*')
        .eq('id', templateId)
        .single();
    if (tErr) throw tErr;

    const { data: questions, error: qErr } = await db
        .from('survey_questions')
        .select('*, survey_question_options(*)')
        .eq('survey_template_id', templateId)
        .order('order_index', { ascending: true });
    if (qErr) throw qErr;

    return { template, questions };
};

// List survey templates (for admin or lecturer to manage)
const listSurveyTemplates = async (filters = {}) => {
    let query = db.from('survey_templates').select('*');
    const keys = ['title', 'target_audience', 'is_active', 'created_by'];
    for (const k of keys) {
        if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
            query = query.eq(k, filters[k]);
        }
    }
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
};

// Update a survey template's base fields
const updateSurveyTemplate = async (templateId, updates) => {
    const { data, error } = await db
        .from('survey_templates')
        .update(updates)
        .eq('id', templateId)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// Delete a survey template and its children (questions, options, responses, answers, files)
const deleteSurveyTemplateCascade = async (templateId) => {
    // Deletion is cascaded from survey_templates to survey_questions, then to options, responses, answers, files
    const { data, error } = await db
        .from('survey_templates')
        .delete()
        .eq('id', templateId)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// --- Survey Questions Management ---
const createQuestion = async (questionData) => {
    const { data, error } = await db
        .from('survey_questions')
        .insert(questionData)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

const getQuestion = async (questionId) => {
    const { data, error } = await db
        .from('survey_questions')
        .select('*, survey_question_options(*)')
        .eq('id', questionId)
        .single();
    if (error) throw error;
    return data;
};

const updateQuestion = async (questionId, updates) => {
    const { data, error } = await db
        .from('survey_questions')
        .update(updates)
        .eq('id', questionId)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

const deleteQuestion = async (questionId) => {
    const { data, error } = await db
        .from('survey_questions')
        .delete()
        .eq('id', questionId)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// --- Survey Question Options Management ---
const createQuestionOption = async (optionData) => {
    const { data, error } = await db
        .from('survey_question_options')
        .insert(optionData)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

const updateQuestionOption = async (optionId, updates) => {
    const { data, error } = await db
        .from('survey_question_options')
        .update(updates)
        .eq('id', optionId)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

const deleteQuestionOption = async (optionId) => {
    const { data, error } = await db
        .from('survey_question_options')
        .delete()
        .eq('id', optionId)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// --- Survey Responses Management ---
const createResponse = async (responseData) => {
    const { data, error } = await db
        .from('survey_responses')
        .insert(responseData)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

const getResponseWithAnswers = async (responseId) => {
    const { data: response, error: rErr } = await db
        .from('survey_responses')
        .select('*, survey_answers(*, survey_answer_options(*), survey_answer_files(*))')
        .eq('id', responseId)
        .single();
    if (rErr) throw rErr;
    return response;
};

const updateResponse = async (responseId, updates) => {
    const { data, error } = await db
        .from('survey_responses')
        .update(updates)
        .eq('id', responseId)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// --- Survey Answers Management ---
const createAnswer = async (answerData) => {
    const { data, error } = await db
        .from('survey_answers')
        .insert(answerData)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

const updateAnswer = async (answerId, updates) => {
    const { data, error } = await db
        .from('survey_answers')
        .update(updates)
        .eq('id', answerId)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// --- Survey Answer Options Management ---
const createAnswerOption = async (answerOptionData) => {
    const { data, error } = await db
        .from('survey_answer_options')
        .insert(answerOptionData)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

const deleteAnswerOption = async (answerOptionId) => {
    const { data, error } = await db
        .from('survey_answer_options')
        .delete()
        .eq('id', answerOptionId)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// --- Survey Answer Files Management ---
const createAnswerFile = async (answerFileData) => {
    const { data, error } = await db
        .from('survey_answer_files')
        .insert(answerFileData)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

const deleteAnswerFile = async (answerFileId) => {
    const { data, error } = await db
        .from('survey_answer_files')
        .delete()
        .eq('id', answerFileId)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// --- Survey Statistics Management ---
const updateSurveyStatistics = async (templateId) => {
    // Aggregate totals
    const { count: totalCount, error: trError } = await db
        .from('survey_responses')
        .select('*', { head: true, count: 'exact' })
        .eq('survey_template_id', templateId);
    if (trError) throw trError;

    const { count: completedCount, error: crError } = await db
        .from('survey_responses')
        .select('*', { head: true, count: 'exact' })
        .eq('survey_template_id', templateId)
        .eq('is_complete', true);
    if (crError) throw crError;

    let averageCompletionTimeSeconds = null;
    // Compute average completion time for completed responses
    const { data: completedRows, error: rowsErr } = await db
        .from('survey_responses')
        .select('started_at, completed_at')
        .eq('survey_template_id', templateId)
        .eq('is_complete', true)
        .not('completed_at', 'is', null);
    if (rowsErr) throw rowsErr;
    if (completedRows && completedRows.length > 0) {
        let totalSecs = 0;
        let n = 0;
        for (const r of completedRows) {
            const start = r.started_at ? new Date(r.started_at).getTime() : null;
            const end = r.completed_at ? new Date(r.completed_at).getTime() : null;
            if (start && end && end >= start) {
                totalSecs += Math.floor((end - start) / 1000);
                n += 1;
            }
        }
        if (n > 0) averageCompletionTimeSeconds = Math.round(totalSecs / n);
    }

    const { data, error } = await db
        .from('survey_statistics')
        .upsert({
            survey_template_id: templateId,
            total_responses: totalCount || 0,
            completed_responses: completedCount || 0,
            average_completion_time_seconds: averageCompletionTimeSeconds,
            last_updated: new Date().toISOString()
        })
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// --- Visibility and helper queries ---
const listVisibleTemplatesForUser = async (role) => {
    let query = db
        .from('survey_templates')
        .select('*')
        .eq('is_active', true);

    const now = new Date().toISOString();
    // start_date is null or <= now
    query = query.or(`start_date.is.null,start_date.lte.${now}`);
    // end_date is null or >= now
    query = query.or(`end_date.is.null,end_date.gte.${now}`);

    const adminRoles = ['admin', 'administrator', 'sys_admin'];
    if (!adminRoles.includes(role)) {
        // Restrict by audience for non-admins
        let audiences = ['all', 'both', 'everyone'];
        if (role === 'student') {
            audiences = audiences.concat(['student', 'students']); // Accept both singular and plural
        } else if (role === 'lecturer') {
            audiences = audiences.concat(['lecturer', 'lecturers', 'all_staff']); // Accept both singular and plural
        } else {
            // Fallback: include role string as-is for any custom role naming
            audiences = audiences.concat([role]);
        }
        query = query.in('target_audience', audiences);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
};

const hasUserCompletedResponse = async (templateId, userId) => {
    const { data, error } = await db
        .from('survey_responses')
        .select('id')
        .eq('survey_template_id', templateId)
        .eq('respondent_id', userId)
        .eq('is_complete', true)
        .limit(1);
    if (error) throw error;
    return Array.isArray(data) && data.length > 0;
};

const getResponsesByTemplate = async (templateId, onlyComplete = true) => {
    let q = db
        .from('survey_responses')
        .select('*')
        .eq('survey_template_id', templateId);
    if (onlyComplete) q = q.eq('is_complete', true);
    const { data, error } = await q;
    if (error) throw error;
    return data || [];
};

const getAnswersByResponseIds = async (responseIds) => {
    if (!responseIds || responseIds.length === 0) return [];
    const { data, error } = await db
        .from('survey_answers')
        .select('*')
        .in('response_id', responseIds);
    if (error) throw error;
    return data || [];
};

const getAnswerOptionsByAnswerIds = async (answerIds) => {
    if (!answerIds || answerIds.length === 0) return [];
    const { data, error } = await db
        .from('survey_answer_options')
        .select('*')
        .in('answer_id', answerIds);
    if (error) throw error;
    return data || [];
};

// Export all functions
module.exports = {
    createSurveyTemplate,
    getSurveyTemplateDetails,
    listSurveyTemplates,
    updateSurveyTemplate,
    deleteSurveyTemplateCascade,
    createQuestion,
    getQuestion,
    updateQuestion,
    deleteQuestion,
    createQuestionOption,
    updateQuestionOption,
    deleteQuestionOption,
    createResponse,
    getResponseWithAnswers,
    updateResponse,
    createAnswer,
    updateAnswer,
    createAnswerOption,
    deleteAnswerOption,
    createAnswerFile,
    deleteAnswerFile,
    updateSurveyStatistics,
    listVisibleTemplatesForUser,
    hasUserCompletedResponse,
    getResponsesByTemplate,
    getAnswersByResponseIds,
    getAnswerOptionsByAnswerIds,
};


