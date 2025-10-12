-- Run these queries in Supabase to verify your survey data

-- 1. Check the survey template you just created
SELECT * FROM survey_templates 
WHERE id = '138823c0-48de-4f34-a358-ba8b66699edd';

-- 2. List all survey templates
SELECT id, title, description, target_audience, is_active, created_at 
FROM survey_templates 
ORDER BY created_at DESC;

-- 3. Check if there are any questions for this survey
SELECT sq.id, sq.question_text, sq.question_type, sq.is_required, sq.order_index
FROM survey_questions sq
WHERE sq.survey_template_id = '138823c0-48de-4f34-a358-ba8b66699edd'
ORDER BY sq.order_index;

-- 4. Check survey responses
SELECT sr.id, sr.respondent_id, sr.is_complete, sr.started_at, sr.completed_at
FROM survey_responses sr
WHERE sr.survey_template_id = '138823c0-48de-4f34-a358-ba8b66699edd';

-- 5. Verify the table structure is correct
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'survey_templates'
ORDER BY ordinal_position;
