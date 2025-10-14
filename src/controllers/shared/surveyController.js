const Survey = require('../../models/Survey');
const { response, errorResponse } = require('../../utils/responseHandlers');
const User = require('../../models/User');

// --- Survey Template Management ---

/**
 * Create a new survey template.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createSurveyTemplate = async (req, res) => {
    const { title, description, target_audience, is_active, is_anonymous, allow_multiple_submissions, start_date, end_date, header_image_url, footer_image_url } = req.body;
    const created_by = req.user.id;

    if (!title) {
        return errorResponse(res, 400, 'Survey title is required.');
    }

    try {
        // Only admin roles can create templates
        const adminRoles = ['admin', 'administrator', 'sys_admin'];
        if (!adminRoles.includes(req.user.role)) {
            return errorResponse(res, 403, 'Only administrators can create survey templates');
        }
        const templateData = {
            title,
            description,
            created_by,
            target_audience: target_audience || 'all',
            is_active: is_active !== undefined ? is_active : true,
            is_anonymous: is_anonymous !== undefined ? is_anonymous : false,
            allow_multiple_submissions: allow_multiple_submissions !== undefined ? allow_multiple_submissions : false,
            start_date,
            end_date,
            header_image_url,
            footer_image_url
        };
        const result = await Survey.createSurveyTemplate(templateData);
        response(res, 201, 'Survey template created successfully', result);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get a survey template with its questions and options.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getSurveyTemplateDetails = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Survey.getSurveyTemplateDetails(id);
        if (!result.template) return errorResponse(res, 404, 'Survey template not found');
        response(res, 200, 'Survey template details fetched successfully', result);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * List survey templates for the authenticated user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const listSurveyTemplates = async (req, res) => {
    const { title, target_audience, is_active, created_by } = req.query;

    try {
        const adminRoles = ['admin', 'administrator', 'sys_admin'];
        let result;
        if (adminRoles.includes(req.user.role)) {
            const filters = { title, target_audience, is_active, created_by };
            result = await Survey.listSurveyTemplates(filters);
        } else {
            result = await Survey.listVisibleTemplatesForUser(req.user.role);
        }
        response(res, 200, 'Survey templates fetched successfully', result);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Update a survey template's base fields.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateSurveyTemplate = async (req, res) => {
    const { id } = req.params;
    const updates = req.body;

    try {
        // Ensure only the creator or an admin can update
        const template = await Survey.getSurveyTemplateDetails(id);
        if (!template.template) return errorResponse(res, 404, 'Survey template not found');

        const adminRoles = ['admin', 'administrator', 'sys_admin'];
        if (template.template.created_by !== req.user.id && !adminRoles.includes(req.user.role)) {
            return errorResponse(res, 403, 'Unauthorized to update this survey template');
        }

        const result = await Survey.updateSurveyTemplate(id, updates);
        response(res, 200, 'Survey template updated successfully', result);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Delete a survey template and its associated data.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const deleteSurveyTemplate = async (req, res) => {
    const { id } = req.params;

    try {
        // Ensure only the creator or an admin can delete
        const template = await Survey.getSurveyTemplateDetails(id);
        if (!template.template) return errorResponse(res, 404, 'Survey template not found');

        const adminRoles = ['admin', 'administrator', 'sys_admin'];
        if (template.template.created_by !== req.user.id && !adminRoles.includes(req.user.role)) {
            return errorResponse(res, 403, 'Unauthorized to delete this survey template');
        }

        await Survey.deleteSurveyTemplateCascade(id);
        response(res, 200, 'Survey template and associated data deleted successfully');
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

// --- Survey Response Management ---

/**
 * Create a new survey response.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createResponse = async (req, res) => {
    const { survey_template_id, is_complete, ip_address, user_agent } = req.body;
    const respondent_id = req.user.id;

    if (!survey_template_id) {
        return errorResponse(res, 400, 'Survey template ID is required.');
    }

    try {
        const responseData = {
            survey_template_id,
            respondent_id,
            is_complete: is_complete !== undefined ? is_complete : false,
            ip_address,
            user_agent
        };
        const result = await Survey.createResponse(responseData);
        response(res, 201, 'Survey response created successfully', result);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Submit survey answers for a response.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const submitSurveyResponse = async (req, res) => {
    const { id } = req.params; // Survey template ID
    const { answers } = req.body;
    const respondent_id = req.user.id;

    try {
        // Ensure survey template exists
        const template = await Survey.getSurveyTemplateDetails(id);
        if (!template.template) return errorResponse(res, 404, 'Survey template not found');

        // Block multiple submissions if not allowed
        if (template.template.allow_multiple_submissions === false) {
            const alreadySubmitted = await Survey.hasUserCompletedResponse(id, respondent_id);
            if (alreadySubmitted) {
                return errorResponse(res, 409, 'You have already submitted this survey');
            }
        }

        // Create or get existing response
        let responseRecord = await Survey.createResponse({
            survey_template_id: id,
            respondent_id,
            is_complete: true,
            completed_at: new Date().toISOString()
        });

        // Process answers
        if (answers && Array.isArray(answers)) {
            for (const answer of answers) {
                const answerData = {
                    response_id: responseRecord.id,
                    question_id: answer.question_id,
                    text_answer: answer.text_answer,
                    number_answer: answer.number_answer,
                    date_answer: answer.date_answer,
                    rating_answer: answer.rating_answer
                };

                const createdAnswer = await Survey.createAnswer(answerData);

                // Handle multiple choice/checkbox options
                if (answer.selected_options && Array.isArray(answer.selected_options)) {
                    for (const optionId of answer.selected_options) {
                        await Survey.createAnswerOption({
                            answer_id: createdAnswer.id,
                            option_id: optionId,
                            custom_text: answer.custom_text
                        });
                    }
                }

                // Handle file uploads
                if (answer.files && Array.isArray(answer.files)) {
                    for (const file of answer.files) {
                        await Survey.createAnswerFile({
                            answer_id: createdAnswer.id,
                            file_url: file.url,
                            file_name: file.name,
                            file_type: file.type,
                            file_size_bytes: file.size
                        });
                    }
                }
            }
        }

        // Update survey statistics
        await Survey.updateSurveyStatistics(id);

        response(res, 200, 'Survey response submitted successfully');
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

// --- Admin Survey Operations ---

/**
 * Admin: List survey templates with filters.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const adminListSurveys = async (req, res) => {
    const filters = req.query;

    try {
        const result = await Survey.listSurveyTemplates(filters);
        response(res, 200, 'Admin survey templates fetched successfully', result);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Admin: Get survey statistics.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const adminAggregateRatings = async (req, res) => {
    const { templateId } = req.params;

    try {
        const result = await Survey.updateSurveyStatistics(templateId);
        response(res, 200, 'Survey statistics updated successfully', result);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

// --- Additional endpoints ---

// List visible templates for the current user's role
const getVisibleTemplates = async (req, res) => {
    try {
        const data = await Survey.listVisibleTemplatesForUser(req.user.role);
        response(res, 200, 'Visible survey templates fetched successfully', data);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

// Get submission status for current user on a template
const getSurveyStatus = async (req, res) => {
    const { id } = req.params;
    try {
        const submitted = await Survey.hasUserCompletedResponse(id, req.user.id);
        response(res, 200, 'Survey status fetched successfully', { submitted });
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

// Generate a survey report (for lecturers/admins)
const getSurveyReport = async (req, res) => {
    const { id } = req.params; // template id
    try {
        const template = await Survey.getSurveyTemplateDetails(id);
        if (!template.template) return errorResponse(res, 404, 'Survey template not found');

        const responses = await Survey.getResponsesByTemplate(id, true);
        const responseIds = responses.map(r => r.id);
        const answers = await Survey.getAnswersByResponseIds(responseIds);
        const answerIds = answers.map(a => a.id);
        const answerOptions = await Survey.getAnswerOptionsByAnswerIds(answerIds);

        // Build per-question summary
        const questionSummaries = {};
        for (const q of template.questions) {
            questionSummaries[q.id] = {
                question_id: q.id,
                question_text: q.question_text || q.question || '',
                type: q.question_type || null,
                responses: 0,
                rating: { count: 0, avg: null, min: null, max: null },
                options: {},
                text_answers_count: 0
            };
            if (Array.isArray(q.survey_question_options)) {
                for (const opt of q.survey_question_options) {
                    questionSummaries[q.id].options[opt.id] = { option_id: opt.id, option_text: opt.option_text, count: 0 };
                }
            }
        }

        for (const a of answers) {
            const s = questionSummaries[a.question_id];
            if (!s) continue;
            s.responses += 1;
            if (typeof a.rating_answer === 'number') {
                const val = a.rating_answer;
                s.rating.count += 1;
                s.rating.min = s.rating.min === null ? val : Math.min(s.rating.min, val);
                s.rating.max = s.rating.max === null ? val : Math.max(s.rating.max, val);
                s.rating.avg = s.rating.avg === null ? val : s.rating.avg + val; // temp sum
            }
            if (a.text_answer && String(a.text_answer).trim() !== '') {
                s.text_answers_count += 1;
            }
        }

        // finalize rating averages
        for (const qId of Object.keys(questionSummaries)) {
            const s = questionSummaries[qId];
            if (s.rating.count > 0 && typeof s.rating.avg === 'number') {
                s.rating.avg = Number((s.rating.avg / s.rating.count).toFixed(2));
            } else {
                s.rating.avg = null;
            }
        }

        // count option selections
        for (const ao of answerOptions) {
            const ans = answers.find(x => x.id === ao.answer_id);
            if (!ans) continue;
            const s = questionSummaries[ans.question_id];
            if (!s) continue;
            if (!s.options[ao.option_id]) {
                s.options[ao.option_id] = { option_id: ao.option_id, option_text: null, count: 0 };
            }
            s.options[ao.option_id].count += 1;
        }

        const total_responses = responses.length;
        const report = {
            template: template.template,
            total_responses,
            questions: Object.values(questionSummaries)
        };

        response(res, 200, 'Survey report generated', report);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

// Admin: Get responses (optionally include answers)
const adminGetResponses = async (req, res) => {
    const { id } = req.params; // template id
    const includeAnswers = String(req.query.includeAnswers || 'false').toLowerCase() === 'true';
    try {
        const responses = await Survey.getResponsesByTemplate(id, false);
        if (!includeAnswers) {
            return response(res, 200, 'Survey responses fetched', responses);
        }
        const ids = responses.map(r => r.id);
        const answers = await Survey.getAnswersByResponseIds(ids);
        const answerIds = answers.map(a => a.id);
        const answerOptions = await Survey.getAnswerOptionsByAnswerIds(answerIds);
        response(res, 200, 'Survey responses with answers fetched', { responses, answers, answerOptions });
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

// Admin: Question and Option management
const adminCreateQuestion = async (req, res) => {
    const { templateId } = req.params;
    try {
        const created = await Survey.createQuestion({ ...req.body, survey_template_id: templateId });
        response(res, 201, 'Question created', created);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

const adminUpdateQuestion = async (req, res) => {
    const { questionId } = req.params;
    try {
        const updated = await Survey.updateQuestion(questionId, req.body);
        response(res, 200, 'Question updated', updated);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

const adminDeleteQuestion = async (req, res) => {
    const { questionId } = req.params;
    try {
        const deleted = await Survey.deleteQuestion(questionId);
        response(res, 200, 'Question deleted', deleted);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

const adminCreateOption = async (req, res) => {
    const { questionId } = req.params;
    try {
        const created = await Survey.createQuestionOption({ ...req.body, question_id: questionId });
        response(res, 201, 'Option created', created);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

const adminUpdateOption = async (req, res) => {
    const { optionId } = req.params;
    try {
        const updated = await Survey.updateQuestionOption(optionId, req.body);
        response(res, 200, 'Option updated', updated);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

const adminDeleteOption = async (req, res) => {
    const { optionId } = req.params;
    try {
        const deleted = await Survey.deleteQuestionOption(optionId);
        response(res, 200, 'Option deleted', deleted);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

module.exports = {
    // Survey Template Management
    createSurveyTemplate,
    getSurveyTemplateDetails,
    listSurveyTemplates,
    updateSurveyTemplate,
    deleteSurveyTemplate,

    // Survey Response Management
    createResponse,
    submitSurveyResponse,

    // Admin Operations
    adminListSurveys,
    adminAggregateRatings,

    // Additional
    getVisibleTemplates,
    getSurveyStatus,
    getSurveyReport,
    adminGetResponses,
    adminCreateQuestion,
    adminUpdateQuestion,
    adminDeleteQuestion,
    adminCreateOption,
    adminUpdateOption,
    adminDeleteOption
};


