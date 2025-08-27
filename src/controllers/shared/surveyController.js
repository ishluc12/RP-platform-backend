const {
    createSurvey,
    addRatings,
    upsertComments,
    getSurveyWithDetails,
    listSurveysByStudent,
    updateSurvey,
    replaceRatings,
    deleteSurveyCascade,
    adminListSurveys,
    adminAggregateRatings
} = require('../../models/Survey');
const path = require('path');
const fs = require('fs');

// Create a survey with ratings and optional comments (restricted to sys_admin)
const studentCreateSurvey = async (req, res) => {
    try {
        if (req.user.role !== 'sys_admin') {
            return res.status(403).json({ success: false, message: 'Only sys_admin can create surveys' });
        }

        const { target_student_id, target_department, target_all_students, module_code, module_name, academic_year, semester, department, program, class: className, module_leader_name, ratings, comments } = req.body;

        const User = require('../../models/User');

        let targetStudentIds = [];
        if (target_all_students === true) {
            // University-wide survey: all students
            const listRes = await User.listStudentsByDepartment(undefined);
            if (!listRes.success) {
                return res.status(500).json({ success: false, message: 'Failed to fetch students for university' });
            }
            targetStudentIds = (listRes.data || []).map(u => u.id);
            if (targetStudentIds.length === 0) {
                return res.status(400).json({ success: false, message: 'No students found in the university' });
            }
        } else if (target_department) {
            // Department-wide survey: collect all student IDs in department
            const listRes = await User.listStudentsByDepartment(target_department);
            if (!listRes.success) {
                return res.status(500).json({ success: false, message: 'Failed to fetch students for department' });
            }
            targetStudentIds = (listRes.data || []).map(u => u.id);
            if (targetStudentIds.length === 0) {
                return res.status(400).json({ success: false, message: 'No students found in specified department' });
            }
        } else {
            const studentId = Number(target_student_id);
            if (!studentId || Number.isNaN(studentId)) {
                return res.status(400).json({ success: false, message: 'target_student_id is required and must be a number (or provide target_department)' });
            }
            const studentResult = await User.findById(studentId);
            if (!studentResult.success || !studentResult.data) {
                return res.status(400).json({ success: false, message: 'Target student not found' });
            }
            if (studentResult.data.role !== 'student') {
                return res.status(400).json({ success: false, message: 'target_student_id must belong to a student' });
            }
            targetStudentIds = [studentId];
        }

        if (!module_code || !module_name) {
            return res.status(400).json({ success: false, message: 'module_code and module_name are required' });
        }
        if (!Array.isArray(ratings) || ratings.length === 0) {
            return res.status(400).json({ success: false, message: 'ratings array is required' });
        }

        if (targetStudentIds.length === 0) {
            // Broadcast mode: create a single survey with student_id = NULL
            const survey = await createSurvey({
                module_code,
                module_name,
                academic_year: academic_year || null,
                semester: semester || null,
                department: target_department || null, // null means all-university broadcast
                program: program || null,
                class: className || null,
                module_leader_name: module_leader_name || null,
                student_id: null
            });
            await addRatings(ratings.map(r => ({ survey_id: survey.id, description: r.description, rating: r.rating, comment: r.comment || null })));
            if (comments) await upsertComments(survey.id, comments);
            return res.status(201).json({ success: true, data: { created_count: 1, survey_ids: [survey.id], broadcast: true } });
        } else {
            // Create one survey per target student
            const created = [];
            for (const sid of targetStudentIds) {
                const survey = await createSurvey({
                    module_code,
                    module_name,
                    academic_year: academic_year || null,
                    semester: semester || null,
                    department: department || null,
                    program: program || null,
                    class: className || null,
                    module_leader_name: module_leader_name || null,
                    student_id: sid
                });

                await addRatings(ratings.map(r => ({ survey_id: survey.id, description: r.description, rating: r.rating, comment: r.comment || null })));
                if (comments) {
                    await upsertComments(survey.id, comments);
                }
                created.push(survey.id);
            }

            return res.status(201).json({ success: true, data: { created_count: created.length, survey_ids: created, broadcast: false } });
        }
    } catch (error) {
        console.error('Error creating survey:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Student: list own surveys with optional filters
const studentListSurveys = async (req, res) => {
    try {
        const filters = {
            module_code: req.query.module_code,
            academic_year: req.query.academic_year,
            semester: req.query.semester
        };
        // Fetch user's department to include department/all-student broadcast surveys
        const User = require('../../models/User');
        const me = await User.findById(req.user.id);
        const myDept = me.success && me.data ? me.data.department : null;
        const data = await listSurveysByStudent(req.user.id, myDept, filters);
        return res.json({ success: true, data });
    } catch (error) {
        console.error('Error listing surveys:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Student: get one own survey with details
const studentGetSurvey = async (req, res) => {
    try {
        const studentId = req.user.id;
        const surveyId = Number(req.params.id);
        if (Number.isNaN(surveyId)) return res.status(400).json({ success: false, message: 'Invalid survey ID' });

        const details = await getSurveyWithDetails(surveyId);
        if (!details.survey || details.survey.student_id !== studentId) {
            return res.status(404).json({ success: false, message: 'Survey not found' });
        }
        return res.json({ success: true, data: details });
    } catch (error) {
        console.error('Error fetching survey:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Update base fields/ratings/comments (restricted to sys_admin)
const studentUpdateSurvey = async (req, res) => {
    try {
        if (req.user.role !== 'sys_admin') {
            return res.status(403).json({ success: false, message: 'Only sys_admin can update surveys' });
        }
        const surveyId = Number(req.params.id);
        if (Number.isNaN(surveyId)) return res.status(400).json({ success: false, message: 'Invalid survey ID' });

        const { module_code, module_name, academic_year, semester, department, program, class: className, module_leader_name, ratings, comments } = req.body;

        const updates = {};
        if (module_code !== undefined) updates.module_code = module_code;
        if (module_name !== undefined) updates.module_name = module_name;
        if (academic_year !== undefined) updates.academic_year = academic_year;
        if (semester !== undefined) updates.semester = semester;
        if (department !== undefined) updates.department = department;
        if (program !== undefined) updates.program = program;
        if (className !== undefined) updates.class = className;
        if (module_leader_name !== undefined) updates.module_leader_name = module_leader_name;

        if (Object.keys(updates).length) {
            // sys_admin can update regardless of student ownership; pass null to skip ownership constraint
            await updateSurvey(surveyId, null, updates);
        }

        if (Array.isArray(ratings)) {
            await replaceRatings(surveyId, ratings.map(r => ({ description: r.description, rating: r.rating, comment: r.comment || null })));
        }

        if (comments) {
            await upsertComments(surveyId, comments);
        }

        const details = await getSurveyWithDetails(surveyId);
        if (!details.survey) return res.status(404).json({ success: false, message: 'Survey not found' });
        return res.json({ success: true, data: details });
    } catch (error) {
        console.error('Error updating survey:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Delete survey (restricted to sys_admin)
const studentDeleteSurvey = async (req, res) => {
    try {
        if (req.user.role !== 'sys_admin') {
            return res.status(403).json({ success: false, message: 'Only sys_admin can delete surveys' });
        }
        const surveyId = Number(req.params.id);
        if (Number.isNaN(surveyId)) return res.status(400).json({ success: false, message: 'Invalid survey ID' });
        const deleted = await deleteSurveyCascade(surveyId, null);
        return res.json({ success: true, data: deleted });
    } catch (error) {
        console.error('Error deleting survey:', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Admin: list surveys
const adminGetSurveys = async (req, res) => {
    try {
        const filters = { ...req.query };
        const data = await adminListSurveys(filters);
        return res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching surveys (admin):', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Admin: get survey details
const adminGetSurveyDetails = async (req, res) => {
    try {
        const surveyId = Number(req.params.id);
        if (Number.isNaN(surveyId)) return res.status(400).json({ success: false, message: 'Invalid survey ID' });
        const details = await getSurveyWithDetails(surveyId);
        if (!details.survey) return res.status(404).json({ success: false, message: 'Survey not found' });
        return res.json({ success: true, data: details });
    } catch (error) {
        console.error('Error fetching survey details (admin):', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

// Admin: aggregate ratings for filters
const adminGetAggregates = async (req, res) => {
    try {
        const filters = { ...req.query };
        const data = await adminAggregateRatings(filters);
        return res.json({ success: true, data });
    } catch (error) {
        console.error('Error aggregating ratings (admin):', error);
        return res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
};

module.exports = {
    studentCreateSurvey,
    studentListSurveys,
    studentGetSurvey,
    studentUpdateSurvey,
    studentDeleteSurvey,
    adminGetSurveys,
    adminGetSurveyDetails,
    adminGetAggregates,
    // Upload survey attachments (sys_admin only)
    uploadSurveyAttachment: async (req, res) => {
        try {
            if (req.user.role !== 'sys_admin') {
                return res.status(403).json({ success: false, message: 'Only sys_admin can upload survey files' });
            }
            const surveyId = Number(req.params.id);
            if (Number.isNaN(surveyId)) return res.status(400).json({ success: false, message: 'Invalid survey ID' });
            if (!req.file) return res.status(400).json({ success: false, message: 'No file uploaded' });

            const fileUrl = `/uploads/surveys/${req.file.filename}`;
            const attachment = await require('../../models/Survey').addAttachmentForSurvey(
                surveyId,
                req.user.id,
                fileUrl,
                req.file.originalname,
                req.file.mimetype
            );
            return res.status(201).json({ success: true, data: attachment });
        } catch (error) {
            console.error('Error uploading survey file:', error);
            return res.status(500).json({ success: false, message: 'Server error', error: error.message });
        }
    }
};


