-- Update target_audience_enum to include department-based values
-- Drop the old enum and create a new one with department values
-- First, drop the column that uses the enum
ALTER TABLE events DROP COLUMN IF EXISTS target_audience;
-- Drop the old enum type
DROP TYPE IF EXISTS target_audience_enum;
-- Create new enum with department-based values
CREATE TYPE target_audience_enum AS ENUM (
    'all',
    'Civil Engineering',
    'Creative Arts',
    'Mechanical Engineering',
    'Electrical & Electronics Engineering',
    'Information & Communication Technology (ICT)',
    'Mining Engineering',
    'Transport and Logistics'
);
-- Add the column back with the new enum
ALTER TABLE events
ADD COLUMN target_audience target_audience_enum DEFAULT 'all';
-- Add a comment to explain the enum values
COMMENT ON TYPE target_audience_enum IS 'Target audience for events: all departments or specific department';