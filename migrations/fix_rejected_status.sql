-- Fix existing appointments with invalid "rejected" status
-- Convert all "rejected" statuses to "declined" which is the valid enum value

-- First, check if there are any appointments with invalid status
-- This will help us see the extent of the problem
SELECT id, status, appointment_time, created_at
FROM appointments
WHERE status NOT IN ('pending', 'accepted', 'declined', 'completed', 'cancelled', 'rescheduled');

-- Update all appointments with "rejected" status to "declined"
-- Note: This assumes status is stored as TEXT. If it's an ENUM type, 
-- we may need to temporarily alter the column type first.

-- Method 1: If status is TEXT or VARCHAR
UPDATE appointments
SET status = 'declined'
WHERE status = 'rejected';

-- Method 2: If status is stored as ENUM and blocking updates, 
-- we need to temporarily change the column type:
-- Uncomment these lines if Method 1 doesn't work:

-- ALTER TABLE appointments 
-- ALTER COLUMN status TYPE TEXT;

-- UPDATE appointments
-- SET status = 'declined'
-- WHERE status = 'rejected';

-- ALTER TABLE appointments
-- ALTER COLUMN status TYPE appointment_status USING status::appointment_status;

-- Verify the fix
SELECT status, COUNT(*) as count
FROM appointments
GROUP BY status
ORDER BY count DESC;
