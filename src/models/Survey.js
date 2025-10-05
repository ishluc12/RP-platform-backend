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
    // This function would typically be triggered by a database trigger or a background job
    // For direct calls, it aggregates current data
    const { data: totalResponsesData, error: trError } = await db
        .from('survey_responses')
        .select('count', { head: true, count: 'exact' })
        .eq('survey_template_id', templateId);
    if (trError) throw trError;

    const totalResponses = totalResponsesData.count;

    const { data: completedResponsesData, error: crError } = await db
        .from('survey_responses')
        .select('count', { head: true, count: 'exact' })
        .eq('survey_template_id', templateId)
        .eq('is_complete', true);
    if (crError) throw crError;

    const completedResponses = completedResponsesData.count;

    const { data, error } = await db
        .from('survey_statistics')
        .upsert({
            survey_template_id: templateId,
            total_responses: totalResponses,
            completed_responses: completedResponses,
            last_updated: new Date().toISOString()
        })
        .select('*')
        .single();
    if (error) throw error;
    return data;
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
};


