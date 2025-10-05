-- Drop tables in reverse order of dependency
DROP TABLE IF EXISTS survey_answer_files CASCADE;
DROP TABLE IF EXISTS survey_answer_options CASCADE;
DROP TABLE IF EXISTS survey_answers CASCADE;
DROP TABLE IF EXISTS survey_responses CASCADE;
DROP TABLE IF EXISTS survey_question_options CASCADE;
DROP TABLE IF EXISTS survey_questions CASCADE;
DROP TABLE IF EXISTS survey_statistics CASCADE;
DROP TABLE IF EXISTS survey_templates CASCADE;
-- Drop the enum type
DROP TYPE IF EXISTS question_type;
-- Delete the migration from history if it exists
DELETE FROM migration_history
WHERE name = '014_create_survey_system.sql';
