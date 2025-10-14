-- Sample Survey Data for Testing
-- This script inserts sample surveys, questions, and options

-- First, get a valid admin user ID (replace with actual admin user ID from your database)
-- You can find this by running: SELECT id, email, role FROM users WHERE role IN ('admin', 'sys_admin', 'administrator') LIMIT 1;

-- Insert Sample Survey Template 1: Student Satisfaction Survey
INSERT INTO survey_templates (
    id,
    title,
    description,
    created_by,
    target_audience,
    is_active,
    is_anonymous,
    allow_multiple_submissions,
    start_date,
    end_date
) VALUES (
    'a1111111-1111-1111-1111-111111111111',
    'Student Satisfaction Survey',
    'Help us improve your learning experience by sharing your feedback',
    (SELECT id FROM users WHERE role IN ('admin', 'sys_admin', 'administrator') LIMIT 1),
    'students',
    true,
    false,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '30 days'
) ON CONFLICT (id) DO NOTHING;

-- Insert Questions for Survey 1
INSERT INTO survey_questions (
    id,
    survey_template_id,
    question_text,
    question_type,
    is_required,
    order_index,
    help_text,
    min_rating,
    max_rating,
    rating_labels
) VALUES 
(
    'q1111111-1111-1111-1111-111111111111',
    'a1111111-1111-1111-1111-111111111111',
    'How satisfied are you with the overall quality of teaching?',
    'rating',
    true,
    1,
    'Rate from 1 (Very Dissatisfied) to 5 (Very Satisfied)',
    1,
    5,
    '{"1": "Very Dissatisfied", "2": "Dissatisfied", "3": "Neutral", "4": "Satisfied", "5": "Very Satisfied"}'::jsonb
),
(
    'q1111111-1111-1111-1111-111111111112',
    'a1111111-1111-1111-1111-111111111111',
    'Which aspects of the course do you find most valuable?',
    'checkbox',
    true,
    2,
    'Select all that apply',
    NULL,
    NULL,
    NULL
),
(
    'q1111111-1111-1111-1111-111111111113',
    'a1111111-1111-1111-1111-111111111111',
    'What suggestions do you have for improving the course?',
    'long_text',
    false,
    3,
    'Please provide detailed feedback',
    NULL,
    NULL,
    NULL
) ON CONFLICT (id) DO NOTHING;

-- Insert Options for Question 2 (checkbox question)
INSERT INTO survey_question_options (
    id,
    question_id,
    option_text,
    order_index,
    has_text_input
) VALUES 
(
    'o1111111-1111-1111-1111-111111111111',
    'q1111111-1111-1111-1111-111111111112',
    'Lecture content and materials',
    1,
    false
),
(
    'o1111111-1111-1111-1111-111111111112',
    'q1111111-1111-1111-1111-111111111112',
    'Practical exercises and assignments',
    2,
    false
),
(
    'o1111111-1111-1111-1111-111111111113',
    'q1111111-1111-1111-1111-111111111112',
    'Instructor support and availability',
    3,
    false
),
(
    'o1111111-1111-1111-1111-111111111114',
    'q1111111-1111-1111-1111-111111111112',
    'Online resources and tools',
    4,
    false
),
(
    'o1111111-1111-1111-1111-111111111115',
    'q1111111-1111-1111-1111-111111111112',
    'Other (please specify)',
    5,
    true
) ON CONFLICT (id) DO NOTHING;

-- Insert Sample Survey Template 2: Course Feedback
INSERT INTO survey_templates (
    id,
    title,
    description,
    created_by,
    target_audience,
    is_active,
    is_anonymous,
    allow_multiple_submissions,
    start_date,
    end_date
) VALUES (
    'a2222222-2222-2222-2222-222222222222',
    'Course Feedback Survey',
    'Share your thoughts on the course structure and content',
    (SELECT id FROM users WHERE role IN ('admin', 'sys_admin', 'administrator') LIMIT 1),
    'all',
    true,
    true,
    false,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '60 days'
) ON CONFLICT (id) DO NOTHING;

-- Insert Questions for Survey 2
INSERT INTO survey_questions (
    id,
    survey_template_id,
    question_text,
    question_type,
    is_required,
    order_index,
    help_text,
    min_rating,
    max_rating
) VALUES 
(
    'q2222222-2222-2222-2222-222222222221',
    'a2222222-2222-2222-2222-222222222222',
    'Rate the course difficulty level',
    'rating',
    true,
    1,
    'Rate from 1 (Too Easy) to 5 (Too Difficult)',
    1,
    5
),
(
    'q2222222-2222-2222-2222-222222222222',
    'a2222222-2222-2222-2222-222222222222',
    'What is your preferred learning format?',
    'multiple_choice',
    true,
    2,
    'Select one option',
    NULL,
    NULL
),
(
    'q2222222-2222-2222-2222-222222222223',
    'a2222222-2222-2222-2222-222222222222',
    'Additional comments or suggestions',
    'long_text',
    false,
    3,
    'Optional feedback',
    NULL,
    NULL
) ON CONFLICT (id) DO NOTHING;

-- Insert Options for Question 2 (multiple choice)
INSERT INTO survey_question_options (
    id,
    question_id,
    option_text,
    order_index,
    has_text_input
) VALUES 
(
    'o2222222-2222-2222-2222-222222222221',
    'q2222222-2222-2222-2222-222222222222',
    'In-person lectures',
    1,
    false
),
(
    'o2222222-2222-2222-2222-222222222222',
    'q2222222-2222-2222-2222-222222222222',
    'Online video lectures',
    2,
    false
),
(
    'o2222222-2222-2222-2222-222222222223',
    'q2222222-2222-2222-2222-222222222222',
    'Hybrid (mix of both)',
    3,
    false
),
(
    'o2222222-2222-2222-2222-222222222224',
    'q2222222-2222-2222-2222-222222222222',
    'Self-paced learning',
    4,
    false
) ON CONFLICT (id) DO NOTHING;

-- Insert Sample Survey Template 3: Lecturer Feedback (for lecturers)
INSERT INTO survey_templates (
    id,
    title,
    description,
    created_by,
    target_audience,
    is_active,
    is_anonymous,
    allow_multiple_submissions,
    start_date,
    end_date
) VALUES (
    'a3333333-3333-3333-3333-333333333333',
    'Teaching Resources Survey',
    'Help us understand what resources would improve your teaching experience',
    (SELECT id FROM users WHERE role IN ('admin', 'sys_admin', 'administrator') LIMIT 1),
    'lecturers',
    true,
    false,
    true,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP + INTERVAL '90 days'
) ON CONFLICT (id) DO NOTHING;

-- Insert Questions for Survey 3
INSERT INTO survey_questions (
    id,
    survey_template_id,
    question_text,
    question_type,
    is_required,
    order_index,
    help_text,
    min_rating,
    max_rating
) VALUES 
(
    'q3333333-3333-3333-3333-333333333331',
    'a3333333-3333-3333-3333-333333333333',
    'Rate the adequacy of current teaching resources',
    'rating',
    true,
    1,
    'Rate from 1 (Inadequate) to 5 (Excellent)',
    1,
    5
),
(
    'q3333333-3333-3333-3333-333333333332',
    'a3333333-3333-3333-3333-333333333333',
    'What additional resources would you find helpful?',
    'long_text',
    true,
    2,
    'Please be specific',
    NULL,
    NULL
) ON CONFLICT (id) DO NOTHING;

-- Verify the data
SELECT 
    st.id,
    st.title,
    st.target_audience,
    st.is_active,
    COUNT(sq.id) as question_count
FROM survey_templates st
LEFT JOIN survey_questions sq ON st.id = sq.survey_template_id
GROUP BY st.id, st.title, st.target_audience, st.is_active
ORDER BY st.created_at DESC;
