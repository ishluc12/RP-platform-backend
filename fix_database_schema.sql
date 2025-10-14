-- ===============================================
-- FIX DATABASE SCHEMA FOR STAFF AVAILABILITY
-- ===============================================
-- This script adds the missing availability_type column to staff_availability table
-- Add availability_type column if it doesn't exist
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'availability_type'
) THEN
ALTER TABLE staff_availability
ADD COLUMN availability_type VARCHAR(50) DEFAULT 'regular';
END IF;
END $$;
-- Add other missing columns if they don't exist
DO $$ BEGIN -- Add break_start_time
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'break_start_time'
) THEN
ALTER TABLE staff_availability
ADD COLUMN break_start_time TIME;
END IF;
-- Add break_end_time
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'break_end_time'
) THEN
ALTER TABLE staff_availability
ADD COLUMN break_end_time TIME;
END IF;
-- Add slot_duration_minutes
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'slot_duration_minutes'
) THEN
ALTER TABLE staff_availability
ADD COLUMN slot_duration_minutes INTEGER DEFAULT 30;
END IF;
-- Add max_appointments_per_slot
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'max_appointments_per_slot'
) THEN
ALTER TABLE staff_availability
ADD COLUMN max_appointments_per_slot INTEGER DEFAULT 1;
END IF;
-- Add buffer_time_minutes
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'buffer_time_minutes'
) THEN
ALTER TABLE staff_availability
ADD COLUMN buffer_time_minutes INTEGER DEFAULT 0;
END IF;
-- Add valid_from
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'valid_from'
) THEN
ALTER TABLE staff_availability
ADD COLUMN valid_from DATE;
END IF;
-- Add valid_to
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'valid_to'
) THEN
ALTER TABLE staff_availability
ADD COLUMN valid_to DATE;
END IF;
END $$;
-- Update day_of_week constraint to match specification (0-6 instead of 1-7)
ALTER TABLE staff_availability DROP CONSTRAINT IF EXISTS staff_availability_day_of_week_check;
ALTER TABLE staff_availability
ADD CONSTRAINT staff_availability_day_of_week_check CHECK (
        day_of_week >= 0
        AND day_of_week <= 6
    );
-- Add comments to clarify the schema
COMMENT ON COLUMN staff_availability.availability_type IS 'regular, temporary, special';
COMMENT ON COLUMN staff_availability.day_of_week IS '0 = Sunday, 6 = Saturday';
COMMENT ON COLUMN staff_availability.break_start_time IS 'Optional break time';
COMMENT ON COLUMN staff_availability.break_end_time IS 'Optional break time';
COMMENT ON COLUMN staff_availability.valid_from IS 'Start date for this availability period';
COMMENT ON COLUMN staff_availability.valid_to IS 'End date for this availability period';
-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_availability_type ON staff_availability(availability_type);
CREATE INDEX IF NOT EXISTS idx_staff_availability_valid_period ON staff_availability(valid_from, valid_to);
-- Verify the schema
SELECT column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'staff_availability'
ORDER BY ordinal_position;