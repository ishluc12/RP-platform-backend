-- Migration to add target_audience column to events table
-- This allows events to be targeted to specific user roles: 'students', 'lecturers', or 'both'

-- First, create the ENUM type for target audience
CREATE TYPE target_audience_enum AS ENUM ('students', 'lecturers', 'both');

-- Add the target_audience column to the events table
ALTER TABLE events
ADD COLUMN target_audience target_audience_enum DEFAULT 'both';

-- Add an index for better query performance when filtering by target_audience
CREATE INDEX idx_events_target_audience ON events(target_audience);

-- Update any existing events to have 'both' as target_audience for backwards compatibility
-- This ensures all existing events remain visible to all user types
UPDATE events
SET target_audience = 'both'
WHERE target_audience IS NULL;

-- Add a comment to document the column
COMMENT ON COLUMN events.target_audience IS 'Defines which user roles can see this event: students, lecturers, or both';