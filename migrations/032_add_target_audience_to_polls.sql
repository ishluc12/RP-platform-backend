-- Add target_audience column to polls table
ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS target_audience VARCHAR(255) DEFAULT 'all';

-- Add created_at if not exists
ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

-- Add is_active column for admin control
ALTER TABLE polls 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT TRUE;

-- Add comment
COMMENT ON COLUMN polls.target_audience IS 'Target audience for the poll: all, Civil Engineering, Creative Arts, Mechanical Engineering, Electrical & Electronics Engineering, Information & Communication Technology (ICT), Mining Engineering, Transport and Logistics';
