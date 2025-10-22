-- Comprehensive fix for appointment date issues
-- This script addresses the problem where slots show wrong dates

-- 1. Show current problematic data
SELECT 
    'BEFORE CLEANUP' as status,
    COUNT(*) as total_slots,
    COUNT(CASE WHEN specific_date < CURRENT_DATE THEN 1 END) as past_slots,
    COUNT(CASE WHEN specific_date IS NULL THEN 1 END) as null_date_slots
FROM staff_availability;

-- 2. Show sample of problematic slots
SELECT 
    id, 
    staff_id, 
    specific_date, 
    day_of_week, 
    start_time, 
    end_time,
    availability_type,
    created_at
FROM staff_availability 
WHERE specific_date < CURRENT_DATE 
   OR specific_date IS NULL
ORDER BY specific_date DESC, created_at DESC
LIMIT 10;

-- 3. Delete all past slots and null date slots
DELETE FROM staff_availability 
WHERE specific_date < CURRENT_DATE 
   OR specific_date IS NULL;

-- 4. Show results after cleanup
SELECT 
    'AFTER CLEANUP' as status,
    COUNT(*) as total_slots,
    COUNT(CASE WHEN specific_date < CURRENT_DATE THEN 1 END) as past_slots,
    COUNT(CASE WHEN specific_date IS NULL THEN 1 END) as null_date_slots
FROM staff_availability;

-- 5. Show remaining slots (should only be current and future dates)
SELECT 
    id, 
    staff_id, 
    specific_date, 
    day_of_week, 
    start_time, 
    end_time,
    availability_type,
    EXTRACT(DOW FROM specific_date) as calculated_dow,
    CASE 
        WHEN day_of_week = EXTRACT(DOW FROM specific_date) THEN 'MATCH'
        ELSE 'MISMATCH'
    END as dow_validation
FROM staff_availability 
WHERE is_active = true
ORDER BY specific_date, start_time;

-- 6. Fix any day_of_week mismatches (where day_of_week doesn't match the actual day of specific_date)
UPDATE staff_availability 
SET day_of_week = EXTRACT(DOW FROM specific_date)
WHERE day_of_week != EXTRACT(DOW FROM specific_date)
  AND specific_date IS NOT NULL;

-- 7. Final validation - show all remaining slots
SELECT 
    'FINAL RESULT' as status,
    id, 
    staff_id, 
    specific_date, 
    day_of_week, 
    start_time, 
    end_time,
    availability_type,
    EXTRACT(DOW FROM specific_date) as actual_dow,
    CASE EXTRACT(DOW FROM specific_date)
        WHEN 0 THEN 'Sunday'
        WHEN 1 THEN 'Monday'
        WHEN 2 THEN 'Tuesday'
        WHEN 3 THEN 'Wednesday'
        WHEN 4 THEN 'Thursday'
        WHEN 5 THEN 'Friday'
        WHEN 6 THEN 'Saturday'
    END as day_name
FROM staff_availability 
WHERE is_active = true
ORDER BY specific_date, start_time;