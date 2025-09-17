const Survey = require('../../models/Survey');
const { response, errorResponse } = require('../../utils/responseHandlers');
const User = require('../../models/User'); // Needed to get student's department

// --- Survey Management ---

/**
 * Create a new survey.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const createSurvey = async (req, res) => {
    const { module_code, module_name, academic_year, semester, department, program, class_name, module_leader_name } = req.body;
    const student_id = req.user.id; // Assuming the creator is the student filling it out initially, or admin creates without student_id

    if (!module_code || !module_name) {
        return errorResponse(res, 400, 'Module code and name are required.');
    }

    try {
        const surveyData = {
            module_code,
            module_name,
            academic_year,
            semester,
            department,
            program,
            class: class_name, // 'class' is a reserved keyword, use class_name
            module_leader_name,
            student_id
        };
        const result = await Survey.createSurvey(surveyData);
        response(res, 201, 'Survey created successfully', result);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Get a survey with its ratings and comments.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getSurveyDetails = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await Survey.getSurveyWithDetails(id);
        if (!result.survey) return errorResponse(res, 404, 'Survey not found');
        response(res, 200, 'Survey details fetched successfully', result);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * List surveys for the authenticated student.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const listStudentSurveys = async (req, res) => {
    const studentId = req.user.id;
    const { module_code, academic_year, semester } = req.query;

    try {
        // Get student's department for broadcast surveys
        const userResult = await User.findById(studentId);
        if (!userResult.success) return errorResponse(res, 404, 'User not found');
        const studentDepartment = userResult.data.department;

        const filters = { module_code, academic_year, semester };
        const result = await Survey.listSurveysByStudent(studentId, studentDepartment, filters);
        response(res, 200, 'Student surveys fetched successfully', result);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Update a survey's base fields.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const updateSurvey = async (req, res) => {
    const { id } = req.params;
    const studentId = req.user.id;
    const updates = req.body;

    try {
        // Ensure only the original creator (student_id) or an admin can update basic survey info
        const survey = await Survey.getSurveyWithDetails(id);
        if (!survey.survey) return errorResponse(res, 404, 'Survey not found');

        if (survey.survey.student_id !== studentId && req.user.role !== 'administrator' && req.user.role !== 'sys_admin') {
            return errorResponse(res, 403, 'Unauthorized to update this survey');
        }

        const result = await Survey.updateSurvey(id, updates);
        response(res, 200, 'Survey updated successfully', result);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Delete a survey and its associated data.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const deleteSurvey = async (req, res) => {
    const { id } = req.params;
    const studentId = req.user.id;

    try {
        // Ensure only the original creator (student_id) or an admin can delete a survey
        const survey = await Survey.getSurveyWithDetails(id);
        if (!survey.survey) return errorResponse(res, 404, 'Survey not found');

        if (survey.survey.student_id !== studentId && req.user.role !== 'administrator' && req.user.role !== 'sys_admin') {
            return errorResponse(res, 403, 'Unauthorized to delete this survey');
        }

        await Survey.deleteSurveyCascade(id);
        response(res, 200, 'Survey and associated data deleted successfully');
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

// --- Survey Ratings and Comments ---

/**
 * Submit or update survey ratings and comments.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const submitSurveyResponse = async (req, res) => {
    const { id } = req.params; // Survey ID
    const { ratings, comments } = req.body;
    const studentId = req.user.id; // User submitting the response

    try {
        // Ensure survey exists and is either for this student or a broadcast survey
        const surveyDetails = await Survey.getSurveyWithDetails(id);
        if (!surveyDetails.survey) return errorResponse(res, 404, 'Survey not found');

        // If survey is specific to a student, ensure it's for this student
        if (surveyDetails.survey.student_id && surveyDetails.survey.student_id !== studentId) {
            return errorResponse(res, 403, 'Unauthorized to respond to this survey');
        }

        // If survey is a broadcast, ensure this student hasn't already filled it
        if (!surveyDetails.survey.student_id) {
            const existingResponse = await Survey.listSurveysByStudent(studentId, null, { id: id });
            if (existingResponse && existingResponse.length > 0) {
                return errorResponse(res, 400, 'You have already responded to this survey.');
            }
        }

        // Add/replace ratings
        if (ratings && Array.isArray(ratings)) {
            await Survey.replaceRatings(id, ratings);
        }

        // Upsert comments
        if (comments) {
            await Survey.upsertComments(id, comments);
        }

        // Mark survey as filled by this student if it was a broadcast survey
        if (!surveyDetails.survey.student_id) {
            await Survey.updateSurvey(id, { student_id: studentId, filled_at: new Date().toISOString() });
        }

        response(res, 200, 'Survey response submitted successfully');
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

// --- Admin Survey Operations ---

/**
 * Admin: List surveys with filters.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const adminListSurveys = async (req, res) => {
    const filters = req.query; // Filters can be module_code, academic_year, etc.

    try {
        const result = await Survey.adminListSurveys(filters);
        response(res, 200, 'Admin surveys fetched successfully', result);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

/**
 * Admin: Aggregate ratings for surveys based on filters.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const adminAggregateRatings = async (req, res) => {
    const filters = req.query; // Filters can be module_code, academic_year, etc.

    try {
        const result = await Survey.adminAggregateRatings(filters);
        response(res, 200, 'Survey ratings aggregated successfully', result);
    } catch (error) {
        errorResponse(res, 500, error.message);
    }
};

module.exports = {
    createSurvey,
    getSurveyDetails,
    listStudentSurveys,
    updateSurvey,
    deleteSurvey,
    submitSurveyResponse,
    adminListSurveys,
    adminAggregateRatings
};


