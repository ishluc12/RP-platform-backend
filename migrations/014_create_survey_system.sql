-- =======================
-- ENHANCED SURVEY SYSTEM
-- =======================
-- Survey Templates (Created by sys_admin/administrator)
CREATE TABLE survey_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    created_by UUID REFERENCES users(id),
    target_audience VARCHAR(50),
    -- 'students', 'lecturers', 'all_staff', 'all'
    is_active BOOLEAN DEFAULT TRUE,
    is_anonymous BOOLEAN DEFAULT FALSE,
    allow_multiple_submissions BOOLEAN DEFAULT FALSE,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    header_image_url TEXT,
    -- For Image 1 (header)
    footer_image_url TEXT,
    -- For Image 2 (footer)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Question Types Enum
CREATE TYPE question_type AS ENUM (
    'multiple_choice',
    'checkbox',
    'short_text',
    'long_text',
    'rating',
    'file_upload',
    'date',
    'email',
    'number'
);
-- Survey Questions
CREATE TABLE survey_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_template_id UUID REFERENCES survey_templates(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type NOT NULL,
    is_required BOOLEAN DEFAULT FALSE,
    order_index INTEGER NOT NULL,
    -- For question ordering
    help_text TEXT,
    -- For rating questions
    min_rating INTEGER,
    max_rating INTEGER,
    rating_labels JSONB,
    -- e.g., {"1": "Poor", "5": "Excellent"}
    -- For file upload questions
    allowed_file_types TEXT [],
    -- e.g., ['pdf', 'doc', 'docx', 'jpg', 'png']
    max_file_size_mb INTEGER,
    -- Maximum file size in MB
    -- For number questions
    min_value NUMERIC,
    max_value NUMERIC,
    -- For text questions
    max_length INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_question_order UNIQUE(survey_template_id, order_index)
);
-- Multiple Choice/Checkbox Options
CREATE TABLE survey_question_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    order_index INTEGER NOT NULL,
    has_text_input BOOLEAN DEFAULT FALSE,
    -- For "Other (please specify)" options
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_option_order UNIQUE(question_id, order_index)
);
-- Survey Responses (User submissions)
CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_template_id UUID REFERENCES survey_templates(id),
    respondent_id UUID REFERENCES users(id),
    -- NULL if anonymous
    is_complete BOOLEAN DEFAULT FALSE,
    started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    ip_address INET,
    user_agent TEXT,
    CONSTRAINT unique_user_survey UNIQUE NULLS NOT DISTINCT (survey_template_id, respondent_id)
);
-- Individual Question Answers
CREATE TABLE survey_answers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    response_id UUID REFERENCES survey_responses(id) ON DELETE CASCADE,
    question_id UUID REFERENCES survey_questions(id),
    -- Different answer types
    text_answer TEXT,
    number_answer NUMERIC,
    date_answer DATE,
    rating_answer INTEGER,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_response_question UNIQUE(response_id, question_id)
);
-- For multiple choice/checkbox answers (can have multiple selections)
CREATE TABLE survey_answer_options (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id UUID REFERENCES survey_answers(id) ON DELETE CASCADE,
    option_id UUID REFERENCES survey_question_options(id),
    custom_text TEXT,
    -- For "Other" options with text input
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- File Upload Answers
CREATE TABLE survey_answer_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    answer_id UUID REFERENCES survey_answers(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50),
    file_size_bytes BIGINT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Survey Analytics/Statistics (for quick reporting)
CREATE TABLE survey_statistics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    survey_template_id UUID REFERENCES survey_templates(id),
    total_responses INTEGER DEFAULT 0,
    completed_responses INTEGER DEFAULT 0,
    average_completion_time_seconds INTEGER,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
-- Indexes for performance
CREATE INDEX idx_survey_templates_active ON survey_templates(is_active);
CREATE INDEX idx_survey_templates_creator ON survey_templates(created_by);
CREATE INDEX idx_survey_questions_template ON survey_questions(survey_template_id, order_index);
CREATE INDEX idx_survey_responses_template ON survey_responses(survey_template_id);
CREATE INDEX idx_survey_responses_user ON survey_responses(respondent_id);
CREATE INDEX idx_survey_responses_complete ON survey_responses(is_complete);
CREATE INDEX idx_survey_answers_response ON survey_answers(response_id);
CREATE INDEX idx_survey_answers_question ON survey_answers(question_id);
CREATE INDEX idx_answer_options_answer ON survey_answer_options(answer_id);
CREATE INDEX idx_answer_files_answer ON survey_answer_files(answer_id);
-- Enable RLS
ALTER TABLE survey_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_question_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_answer_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_answer_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE survey_statistics ENABLE ROW LEVEL SECURITY;
-- RLS Policies
-- Survey Templates: Anyone can read active surveys, only admins can create/edit
CREATE POLICY "Anyone can view active survey templates" ON survey_templates FOR
SELECT TO authenticated USING (
        is_active = true
        OR created_by = auth.uid()
    );
CREATE POLICY "Admins can create survey templates" ON survey_templates FOR
INSERT TO authenticated WITH CHECK (
        EXISTS (
            SELECT 1
            FROM users
            WHERE id = auth.uid()
                AND role IN ('administrator', 'sys_admin')
        )
    );
CREATE POLICY "Admins can update their survey templates" ON survey_templates FOR
UPDATE TO authenticated USING (
        created_by = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM users
            WHERE id = auth.uid()
                AND role = 'sys_admin'
        )
    );
CREATE POLICY "Admins can delete their survey templates" ON survey_templates FOR DELETE TO authenticated USING (
    created_by = auth.uid()
    OR EXISTS (
        SELECT 1
        FROM users
        WHERE id = auth.uid()
            AND role = 'sys_admin'
    )
);
-- Survey Questions: Read access for surveys user can see, write for template creators
CREATE POLICY "Users can view questions of accessible surveys" ON survey_questions FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM survey_templates
            WHERE id = survey_questions.survey_template_id
                AND (
                    is_active = true
                    OR created_by = auth.uid()
                )
        )
    );
CREATE POLICY "Template creators can manage questions" ON survey_questions FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM survey_templates
        WHERE id = survey_questions.survey_template_id
            AND (
                created_by = auth.uid()
                OR EXISTS (
                    SELECT 1
                    FROM users
                    WHERE id = auth.uid()
                        AND role = 'sys_admin'
                )
            )
    )
);
-- Survey Question Options: Similar to questions
CREATE POLICY "Users can view options of accessible questions" ON survey_question_options FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM survey_questions sq
                JOIN survey_templates st ON sq.survey_template_id = st.id
            WHERE sq.id = survey_question_options.question_id
                AND (
                    st.is_active = true
                    OR st.created_by = auth.uid()
                )
        )
    );
CREATE POLICY "Question creators can manage options" ON survey_question_options FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM survey_questions sq
            JOIN survey_templates st ON sq.survey_template_id = st.id
        WHERE sq.id = survey_question_options.question_id
            AND (
                st.created_by = auth.uid()
                OR EXISTS (
                    SELECT 1
                    FROM users
                    WHERE id = auth.uid()
                        AND role = 'sys_admin'
                )
            )
    )
);
-- Survey Responses: Users can view their own, admins can view all
CREATE POLICY "Users can view their own responses" ON survey_responses FOR
SELECT TO authenticated USING (
        respondent_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM survey_templates
            WHERE id = survey_responses.survey_template_id
                AND created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM users
            WHERE id = auth.uid()
                AND role IN ('administrator', 'sys_admin')
        )
    );
CREATE POLICY "Users can create their own responses" ON survey_responses FOR
INSERT TO authenticated WITH CHECK (
        respondent_id = auth.uid()
        OR EXISTS (
            SELECT 1
            FROM survey_templates
            WHERE id = survey_template_id
                AND is_anonymous = true
        )
    );
CREATE POLICY "Users can update their own responses" ON survey_responses FOR
UPDATE TO authenticated USING (respondent_id = auth.uid());
-- Survey Answers: Users can manage their own answers
CREATE POLICY "Users can view answers they have access to" ON survey_answers FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM survey_responses
            WHERE id = survey_answers.response_id
                AND (
                    respondent_id = auth.uid()
                    OR EXISTS (
                        SELECT 1
                        FROM survey_templates st
                        WHERE st.id = survey_responses.survey_template_id
                            AND st.created_by = auth.uid()
                    )
                    OR EXISTS (
                        SELECT 1
                        FROM users
                        WHERE id = auth.uid()
                            AND role IN ('administrator', 'sys_admin')
                    )
                )
        )
    );
CREATE POLICY "Users can manage their own answers" ON survey_answers FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM survey_responses
        WHERE id = survey_answers.response_id
            AND respondent_id = auth.uid()
    )
);
-- Answer Options: Similar to answers
CREATE POLICY "Allow all operations on answer_options" ON survey_answer_options FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Answer Files: Similar to answers
CREATE POLICY "Allow all operations on answer_files" ON survey_answer_files FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Survey Statistics: Template creators and admins can view
CREATE POLICY "Creators and admins can view statistics" ON survey_statistics FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM survey_templates
            WHERE id = survey_statistics.survey_template_id
                AND created_by = auth.uid()
        )
        OR EXISTS (
            SELECT 1
            FROM users
            WHERE id = auth.uid()
                AND role IN ('administrator', 'sys_admin')
        )
    );
-- Function to update survey statistics (trigger)
CREATE OR REPLACE FUNCTION update_survey_statistics() RETURNS TRIGGER AS $$ BEGIN IF TG_OP = 'INSERT'
    OR TG_OP = 'UPDATE' THEN
INSERT INTO survey_statistics (
        survey_template_id,
        total_responses,
        completed_responses
    )
SELECT NEW.survey_template_id,
    COUNT(*),
    COUNT(*) FILTER (
        WHERE is_complete = true
    )
FROM survey_responses
WHERE survey_template_id = NEW.survey_template_id ON CONFLICT (survey_template_id) DO
UPDATE
SET total_responses = EXCLUDED.total_responses,
    completed_responses = EXCLUDED.completed_responses,
    last_updated = CURRENT_TIMESTAMP;
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create trigger
CREATE TRIGGER trigger_update_survey_statistics
AFTER
INSERT
    OR
UPDATE ON survey_responses FOR EACH ROW EXECUTE FUNCTION update_survey_statistics();
-- Add unique constraint to survey_statistics
ALTER TABLE survey_statistics
ADD CONSTRAINT unique_survey_template UNIQUE(survey_template_id);