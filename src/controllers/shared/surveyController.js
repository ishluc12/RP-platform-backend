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
        const filters = { title, target_audience, is_active, created_by };
        const result = await Survey.listSurveyTemplates(filters);
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

        if (template.template.created_by !== req.user.id && req.user.role !== 'administrator' && req.user.role !== 'sys_admin') {
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

        if (template.template.created_by !== req.user.id && req.user.role !== 'administrator' && req.user.role !== 'sys_admin') {
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

        // Create or get existing response
        let response = await Survey.createResponse({
            survey_template_id: id,
            respondent_id,
            is_complete: true
        });

        // Process answers
        if (answers && Array.isArray(answers)) {
            for (const answer of answers) {
                const answerData = {
                    response_id: response.id,
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
    adminAggregateRatings
};


