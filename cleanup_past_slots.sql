-- Clean up past availability slots
-- This script removes slots with specific_date in the past

-- Show current date for reference
SELECT CURRENT_DATE as today;

-- Show slots that will be deleted (past dates)
SELECT 
    id, 
    staff_id, 
    specific_date, 
    day_of_week, 
    start_time, 
    end_time,
    availability_type
FROM staff_availability 
WHERE specific_date < CURRENT_DATE 
   OR specific_date IS NULL  -- Also remove old recurring slots
ORDER BY specific_date, start_time;

-- Delete past slots
DELETE FROM staff_availability 
WHERE specific_date < CURRENT_DATE 
   OR specific_date IS NULL;

-- Show remaining slots (should only be current and future dates)
SELECT 
    id, 
    staff_id, 
    specific_date, 
    day_of_week, 
    start_time, 
    end_time,
    availability_type
FROM staff_availability 
WHERE is_active = true
ORDER BY specific_date, start_time;