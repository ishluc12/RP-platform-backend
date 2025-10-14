-- Diagnostic queries to check availability data
-- Run these in your Supabase SQL Editor or database client

-- 1. Check all users with lecturer or administrator role
SELECT id, name, email, role 
FROM users 
WHERE role IN ('lecturer', 'administrator')
ORDER BY role, name;

-- 2. Check all staff availability slots
SELECT 
    sa.id,
    sa.staff_id,
    u.name as staff_name,
    u.role as staff_role,
    sa.day_of_week,
    sa.start_time,
    sa.end_time,
    sa.is_active,
    sa.created_at
FROM staff_availability sa
LEFT JOIN users u ON sa.staff_id = u.id
ORDER BY u.role, sa.day_of_week, sa.start_time;

-- 3. Count availability slots by staff role
SELECT 
    u.role,
    COUNT(sa.id) as slot_count,
    COUNT(CASE WHEN sa.is_active THEN 1 END) as active_slots
FROM users u
LEFT JOIN staff_availability sa ON u.id = sa.staff_id
WHERE u.role IN ('lecturer', 'administrator')
GROUP BY u.role;

-- 4. Check if there are any administrator availability slots
SELECT 
    sa.*,
    u.name as staff_name,
    u.email as staff_email
FROM staff_availability sa
INNER JOIN users u ON sa.staff_id = u.id
WHERE u.role = 'administrator' AND sa.is_active = true;

-- 5. Check RLS policies on staff_availability table (if using Supabase)
SELECT * FROM pg_policies WHERE tablename = 'staff_availability';
