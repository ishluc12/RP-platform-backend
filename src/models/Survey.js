const { supabase, supabaseAdmin } = require('../config/database');
const db = supabaseAdmin || supabase;

// Create a survey
const createSurvey = async (survey) => {
    const { student_id, ...rest } = survey;
    const payload = student_id ? { ...rest, student_id } : { ...rest, student_id: null };
    const { data, error } = await db
        .from('surveys')
        .insert(payload)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// Bulk insert ratings for a survey
const addRatings = async (ratings) => {
    if (!ratings || ratings.length === 0) return [];
    const { data, error } = await db
        .from('survey_ratings')
        .insert(ratings)
        .select('*');
    if (error) throw error;
    return data;
};

// Upsert comments (one row per survey)
const upsertComments = async (surveyId, comments) => {
    const payload = { survey_id: surveyId, ...comments };
    const existing = await db
        .from('survey_comments')
        .select('*')
        .eq('survey_id', surveyId)
        .maybeSingle();
    if (existing.error) throw existing.error;
    if (existing.data) {
        const { data, error } = await db
            .from('survey_comments')
            .update(payload)
            .eq('survey_id', surveyId)
            .select('*')
            .single();
        if (error) throw error;
        return data;
    }
    const { data, error } = await db
        .from('survey_comments')
        .insert(payload)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// Fetch a survey with ratings and comments
const getSurveyWithDetails = async (surveyId) => {
    const { data: survey, error: sErr } = await db
        .from('surveys')
        .select('*')
        .eq('id', surveyId)
        .single();
    if (sErr) throw sErr;

    const { data: ratings, error: rErr } = await db
        .from('survey_ratings')
        .select('*')
        .eq('survey_id', surveyId)
        .order('created_at', { ascending: true });
    if (rErr) throw rErr;

    const { data: comments, error: cErr } = await db
        .from('survey_comments')
        .select('*')
        .eq('survey_id', surveyId)
        .single();
    if (cErr && cErr.code !== 'PGRST116') throw cErr; // allow no rows

    return { survey, ratings, comments: comments || null };
};

// List surveys for a specific student
const listSurveysByStudent = async (studentId, studentDepartment, filters = {}) => {
    // Personal surveys
    let personal = db.from('surveys').select('*').eq('student_id', studentId);
    if (filters.module_code) personal = personal.eq('module_code', filters.module_code);
    if (filters.academic_year) personal = personal.eq('academic_year', filters.academic_year);
    if (filters.semester) personal = personal.eq('semester', filters.semester);
    const personalRes = await personal;
    if (personalRes.error) throw personalRes.error;

    // Broadcast surveys: student_id IS NULL and (department IS NULL OR department == student's department)
    let broadcast = db
        .from('surveys')
        .select('*')
        .is('student_id', null);
    if (filters.module_code) broadcast = broadcast.eq('module_code', filters.module_code);
    if (filters.academic_year) broadcast = broadcast.eq('academic_year', filters.academic_year);
    if (filters.semester) broadcast = broadcast.eq('semester', filters.semester);
    const broadcastResAll = await broadcast;
    if (broadcastResAll.error) throw broadcastResAll.error;
    const filteredBroadcast = (broadcastResAll.data || []).filter(s => !s.department || s.department === studentDepartment);

    const combined = [...(personalRes.data || []), ...filteredBroadcast];
    combined.sort((a, b) => new Date(b.filled_at || b.created_at) - new Date(a.filled_at || a.created_at));
    return combined;
};

// Update base survey fields
const updateSurvey = async (surveyId, updates) => {
    const { data, error } = await db
        .from('surveys')
        .update(updates)
        .eq('id', surveyId)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// Replace ratings for a survey (delete then insert)
const replaceRatings = async (surveyId, ratings) => {
    const { error: delErr } = await db
        .from('survey_ratings')
        .delete()
        .eq('survey_id', surveyId);
    if (delErr) throw delErr;
    return addRatings(ratings.map(r => ({ ...r, survey_id: surveyId })));
};

// Delete a survey and its children
const deleteSurveyCascade = async (surveyId) => {
    const { error: delRatingsErr } = await supabase
        .from('survey_ratings')
        .delete()
        .eq('survey_id', surveyId);
    if (delRatingsErr) throw delRatingsErr;

    const { error: delCommentsErr } = await db
        .from('survey_comments')
        .delete()
        .eq('survey_id', surveyId);
    if (delCommentsErr) throw delCommentsErr;

    const { data, error } = await db
        .from('surveys')
        .delete()
        .eq('id', surveyId)
        .select('*')
        .single();
    if (error) throw error;
    return data;
};

// Admin: list surveys with filters
const adminListSurveys = async (filters = {}) => {
    let query = db.from('surveys').select('*');
    const keys = ['module_code', 'module_name', 'academic_year', 'semester', 'department', 'program', 'class', 'module_leader_name', 'student_id'];
    for (const k of keys) {
        if (filters[k] !== undefined && filters[k] !== null && filters[k] !== '') {
            // Special handling for student_id to ensure it's treated as UUID string
            if (k === 'student_id') {
                query = query.eq(k, String(filters[k]));
            } else {
                query = query.eq(k, filters[k]);
            }
        }
    }
    const { data, error } = await query.order('filled_at', { ascending: false });
    if (error) throw error;
    return data;
};

// Admin: aggregate ratings per description and overall average for a filter set
const adminAggregateRatings = async (filters = {}) => {
    // First fetch matching survey IDs
    const surveys = await adminListSurveys(filters);
    if (surveys.length === 0) return { count: 0, perDescription: [], overallAverage: null };
    const ids = surveys.map(s => s.id);

    const { data: ratings, error } = await db
        .from('survey_ratings')
        .select('description, rating, survey_id')
        .in('survey_id', ids);
    if (error) throw error;

    const map = new Map();
    let total = 0;
    let n = 0;
    for (const r of ratings) {
        total += r.rating;
        n += 1;
        const key = r.description;
        const entry = map.get(key) || { description: key, count: 0, sum: 0 };
        entry.count += 1;
        entry.sum += r.rating;
        map.set(key, entry);
    }
    const perDescription = Array.from(map.values()).map(e => ({ description: e.description, average: e.sum / e.count, count: e.count }));
    const overallAverage = n ? total / n : null;
    return { count: surveys.length, perDescription, overallAverage };
};

module.exports = {
    createSurvey,
    addRatings,
    upsertComments,
    getSurveyWithDetails,
    listSurveysByStudent,
    updateSurvey,
    replaceRatings,
    deleteSurveyCascade,
    adminListSurveys,
    adminAggregateRatings,
    // Attachments for surveys
    addAttachmentForSurvey: async (surveyId, uploadedBy, fileUrl, originalName, mimeType) => {
        const payload = {
            uploaded_by: String(uploadedBy),
            file_url: fileUrl,
            entity_type: 'survey',
            entity_id: String(surveyId),
            original_name: originalName || null,
            mime_type: mimeType || null,
            uploaded_at: new Date().toISOString()
        };
        const { data, error } = await db
            .from('attachments')
            .insert([payload])
            .select('*')
            .single();
        if (error) throw error;
        return data;
    }
};


