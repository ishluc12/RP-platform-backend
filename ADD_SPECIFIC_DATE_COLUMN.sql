-- Add specific_date column to staff_availability table
-- Run this in your database (Supabase SQL Editor or pgAdmin)

ALTER TABLE staff_availability 
ADD COLUMN IF NOT EXISTS specific_date DATE;

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_staff_availability_specific_date 
ON staff_availability(specific_date);

-- Create composite index for date-based queries
CREATE INDEX IF NOT EXISTS idx_staff_availability_date_staff 
ON staff_availability(staff_id, specific_date, is_active);

-- Add comment
COMMENT ON COLUMN staff_availability.specific_date IS 'Specific date for this availability slot (optional, if null uses recurring day_of_week)';

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'staff_availability' 
AND column_name = 'specific_date';
