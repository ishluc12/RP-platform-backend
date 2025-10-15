-- Create feedback table if it doesn't exist
-- This table stores user feedback and suggestions

CREATE TABLE IF NOT EXISTS feedback (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    type VARCHAR(50) DEFAULT 'general' CHECK (type IN ('general', 'bug', 'feature', 'complaint', 'suggestion', 'compliment')),
    subject VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'general' CHECK (category IN ('general', 'technical', 'ui_ux', 'content', 'performance', 'accessibility', 'other')),
    priority VARCHAR(20) DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
    status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed', 'rejected')),
    anonymous BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE NULL,
    admin_notes TEXT NULL,
    resolved_by UUID REFERENCES users(id) ON DELETE SET NULL
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_feedback_user_id ON feedback(user_id);
CREATE INDEX IF NOT EXISTS idx_feedback_status ON feedback(status);
CREATE INDEX IF NOT EXISTS idx_feedback_type ON feedback(type);
CREATE INDEX IF NOT EXISTS idx_feedback_submitted_at ON feedback(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_feedback_category ON feedback(category);

-- Create trigger to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_update_feedback_updated_at
    BEFORE UPDATE ON feedback
    FOR EACH ROW
    EXECUTE FUNCTION update_feedback_updated_at();

-- Add RLS (Row Level Security) policies for feedback
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own feedback
CREATE POLICY IF NOT EXISTS "Users can view own feedback" ON feedback
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can insert their own feedback
CREATE POLICY IF NOT EXISTS "Users can insert own feedback" ON feedback
    FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Policy: Admins can view all feedback
CREATE POLICY IF NOT EXISTS "Admins can view all feedback" ON feedback
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('administrator', 'admin', 'sys_admin')
        )
    );

-- Policy: Admins can update all feedback
CREATE POLICY IF NOT EXISTS "Admins can update all feedback" ON feedback
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('administrator', 'admin', 'sys_admin')
        )
    );

-- Insert some sample feedback categories and types for reference
COMMENT ON TABLE feedback IS 'Stores user feedback, bug reports, and suggestions';
COMMENT ON COLUMN feedback.type IS 'Type of feedback: general, bug, feature, complaint, suggestion, compliment';
COMMENT ON COLUMN feedback.category IS 'Category: general, technical, ui_ux, content, performance, accessibility, other';
COMMENT ON COLUMN feedback.priority IS 'Priority level: low, medium, high, urgent';
COMMENT ON COLUMN feedback.status IS 'Current status: open, in_progress, resolved, closed, rejected';
COMMENT ON COLUMN feedback.anonymous IS 'Whether the feedback was submitted anonymously';