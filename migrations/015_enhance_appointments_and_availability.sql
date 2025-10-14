-- ===============================================
-- ENHANCE APPOINTMENTS AND AVAILABILITY TABLES
-- ===============================================
-- This migration updates the appointments and availability tables to match the enhanced schema
-- First, let's check if we need to update the appointments table
-- The current table structure is already very close, but let's ensure it matches exactly
-- Update appointments table to match the enhanced schema exactly
-- (Most columns already exist, but let's ensure consistency)
-- Add any missing columns to appointments table
DO $$ BEGIN -- Add break_start_time and break_end_time to staff_availability if they don't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'break_start_time'
) THEN
ALTER TABLE staff_availability
ADD COLUMN break_start_time TIME;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'break_end_time'
) THEN
ALTER TABLE staff_availability
ADD COLUMN break_end_time TIME;
END IF;
-- Add max_appointments_per_slot if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'max_appointments_per_slot'
) THEN
ALTER TABLE staff_availability
ADD COLUMN max_appointments_per_slot INTEGER DEFAULT 1;
END IF;
-- Add slot_duration_minutes if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'slot_duration_minutes'
) THEN
ALTER TABLE staff_availability
ADD COLUMN slot_duration_minutes INTEGER DEFAULT 30;
END IF;
-- Add availability_type if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'availability_type'
) THEN
ALTER TABLE staff_availability
ADD COLUMN availability_type VARCHAR(50) DEFAULT 'regular';
END IF;
-- Add valid_from and valid_to if they don't exist
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'valid_from'
) THEN
ALTER TABLE staff_availability
ADD COLUMN valid_from DATE;
END IF;
IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'staff_availability'
        AND column_name = 'valid_to'
) THEN
ALTER TABLE staff_availability
ADD COLUMN valid_to DATE;
END IF;
-- Update day_of_week constraint to match specification (0-6 instead of 1-7)
-- First drop the existing constraint
ALTER TABLE staff_availability DROP CONSTRAINT IF EXISTS staff_availability_day_of_week_check;
-- Add the new constraint
ALTER TABLE staff_availability
ADD CONSTRAINT staff_availability_day_of_week_check CHECK (
        day_of_week >= 0
        AND day_of_week <= 6
    );
END $$;
-- Remove old columns that are no longer needed in staff_availability
-- (These were specific to the old system)
ALTER TABLE staff_availability DROP COLUMN IF EXISTS max_regular_students;
ALTER TABLE staff_availability DROP COLUMN IF EXISTS max_emergency_students;
ALTER TABLE staff_availability DROP COLUMN IF EXISTS allow_emergency;
-- Add comments to clarify the enhanced schema
COMMENT ON TABLE appointments IS 'Enhanced appointments table to support all user roles';
COMMENT ON COLUMN appointments.requester_id IS 'The person requesting the appointment';
COMMENT ON COLUMN appointments.appointee_id IS 'The person being requested (lecturer, admin, sys_admin)';
COMMENT ON COLUMN appointments.meeting_type IS 'in_person or online';
COMMENT ON COLUMN appointments.priority IS 'low, normal, high, urgent';
COMMENT ON COLUMN appointments.appointment_type IS 'academic_consultation, admin_meeting, technical_support, etc.';
COMMENT ON COLUMN appointments.notes IS 'Additional notes from either party';
COMMENT ON TABLE staff_availability IS 'Enhanced availability table for all staff (lecturers, administrators, sys_admins)';
COMMENT ON COLUMN staff_availability.day_of_week IS '0 = Sunday, 6 = Saturday';
COMMENT ON COLUMN staff_availability.break_start_time IS 'Optional break time';
COMMENT ON COLUMN staff_availability.break_end_time IS 'Optional break time';
COMMENT ON COLUMN staff_availability.availability_type IS 'regular, temporary, special';
COMMENT ON COLUMN staff_availability.valid_from IS 'Start date for this availability period';
COMMENT ON COLUMN staff_availability.valid_to IS 'End date for this availability period';
COMMENT ON TABLE availability_exceptions IS 'Special availability exceptions (holidays, sick days, special hours)';
COMMENT ON COLUMN availability_exceptions.exception_type IS 'unavailable, modified_hours, extra_hours';
-- Update indexes for better performance
CREATE INDEX IF NOT EXISTS idx_staff_availability_valid_period ON staff_availability(valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_staff_availability_type ON staff_availability(availability_type);
CREATE INDEX IF NOT EXISTS idx_appointments_appointment_type ON appointments(appointment_type);
CREATE INDEX IF NOT EXISTS idx_appointments_priority ON appointments(priority);
CREATE INDEX IF NOT EXISTS idx_appointments_meeting_type ON appointments(meeting_type);
-- Add RLS policies for the enhanced tables
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
-- RLS Policies for appointments
DROP POLICY IF EXISTS "Users can view their own appointments" ON appointments;
CREATE POLICY "Users can view their own appointments" ON appointments FOR
SELECT TO authenticated USING (
        requester_id = auth.uid()
        OR appointee_id = auth.uid()
    );
DROP POLICY IF EXISTS "Users can create appointments" ON appointments;
CREATE POLICY "Users can create appointments" ON appointments FOR
INSERT TO authenticated WITH CHECK (requester_id = auth.uid());
DROP POLICY IF EXISTS "Appointees can update appointments" ON appointments;
CREATE POLICY "Appointees can update appointments" ON appointments FOR
UPDATE TO authenticated USING (appointee_id = auth.uid()) WITH CHECK (appointee_id = auth.uid());
-- RLS Policies for staff_availability
DROP POLICY IF EXISTS "Staff can manage their own availability" ON staff_availability;
CREATE POLICY "Staff can manage their own availability" ON staff_availability FOR ALL TO authenticated USING (staff_id = auth.uid()) WITH CHECK (staff_id = auth.uid());
DROP POLICY IF EXISTS "Anyone can view active availability" ON staff_availability;
CREATE POLICY "Anyone can view active availability" ON staff_availability FOR
SELECT TO authenticated USING (is_active = true);
-- RLS Policies for availability_exceptions
DROP POLICY IF EXISTS "Staff can manage their own exceptions" ON availability_exceptions;
CREATE POLICY "Staff can manage their own exceptions" ON availability_exceptions FOR ALL TO authenticated USING (staff_id = auth.uid()) WITH CHECK (staff_id = auth.uid());
DROP POLICY IF EXISTS "Anyone can view exceptions" ON availability_exceptions;
CREATE POLICY "Anyone can view exceptions" ON availability_exceptions FOR
SELECT TO authenticated USING (true);
-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ language 'plpgsql';
-- Add triggers for appointments and staff_availability
DROP TRIGGER IF EXISTS update_appointments_updated_at ON appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE
UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
DROP TRIGGER IF EXISTS update_staff_availability_updated_at ON staff_availability;
CREATE TRIGGER update_staff_availability_updated_at BEFORE
UPDATE ON staff_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();