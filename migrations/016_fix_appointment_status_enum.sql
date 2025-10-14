-- ===============================================
-- FIX APPOINTMENT STATUS ENUM INCONSISTENCY
-- ===============================================
-- This migration fixes the mismatch between database enum values and application code
-- The database currently has: 'pending', 'approved', 'rejected', 'completed'
-- But the application code expects: 'pending', 'accepted', 'declined', 'completed', 'cancelled', 'rescheduled'
-- Solution: Add the missing enum values to support both old and new statuses
DO $$ BEGIN -- Add 'accepted' if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'appointment_status'
        AND e.enumlabel = 'accepted'
) THEN ALTER TYPE appointment_status
ADD VALUE 'accepted';
END IF;
-- Add 'declined' if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'appointment_status'
        AND e.enumlabel = 'declined'
) THEN ALTER TYPE appointment_status
ADD VALUE 'declined';
END IF;
-- Add 'cancelled' if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'appointment_status'
        AND e.enumlabel = 'cancelled'
) THEN ALTER TYPE appointment_status
ADD VALUE 'cancelled';
END IF;
-- Add 'rescheduled' if it doesn't exist
IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
        JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'appointment_status'
        AND e.enumlabel = 'rescheduled'
) THEN ALTER TYPE appointment_status
ADD VALUE 'rescheduled';
END IF;
END $$;
-- Update any existing 'approved' statuses to 'accepted' for consistency
-- (Optional: You can comment this out if you want to keep both values)
UPDATE appointments
SET status = 'accepted'
WHERE status = 'approved';
-- Update any existing 'rejected' statuses to 'declined' for consistency
-- (Optional: You can comment this out if you want to keep both values)
UPDATE appointments
SET status = 'declined'
WHERE status = 'rejected';
-- Add a comment to document the enum values
COMMENT ON TYPE appointment_status IS 'Appointment status: pending, accepted, declined, completed, cancelled, rescheduled (legacy: approved, rejected)';
-- Create a function to normalize status values
CREATE OR REPLACE FUNCTION normalize_appointment_status(input_status TEXT) RETURNS appointment_status AS $$ BEGIN -- Normalize common variations
    CASE
        LOWER(input_status)
        WHEN 'approve',
        'approved' THEN RETURN 'accepted';
WHEN 'reject',
'rejected' THEN RETURN 'declined';
WHEN 'accept',
'accepted' THEN RETURN 'accepted';
WHEN 'decline',
'declined' THEN RETURN 'declined';
WHEN 'cancel',
'cancelled' THEN RETURN 'cancelled';
WHEN 'reschedule',
'rescheduled' THEN RETURN 'rescheduled';
WHEN 'complete',
'completed' THEN RETURN 'completed';
WHEN 'pending' THEN RETURN 'pending';
ELSE -- If it's already a valid enum value, return it
IF input_status::appointment_status IS NOT NULL THEN RETURN input_status::appointment_status;
ELSE RAISE EXCEPTION 'Invalid appointment status: %',
input_status;
END IF;
END CASE
;
END;
$$ LANGUAGE plpgsql;
-- Add a trigger to automatically normalize status values on insert/update
CREATE OR REPLACE FUNCTION trigger_normalize_appointment_status() RETURNS TRIGGER AS $$ BEGIN -- Normalize the status if it's being updated
    IF NEW.status IS NOT NULL THEN NEW.status := normalize_appointment_status(NEW.status::TEXT);
END IF;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
-- Create the trigger
DROP TRIGGER IF EXISTS normalize_appointment_status_trigger ON appointments;
CREATE TRIGGER normalize_appointment_status_trigger BEFORE
INSERT
    OR
UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION trigger_normalize_appointment_status();
-- Add helpful comments
COMMENT ON FUNCTION normalize_appointment_status(TEXT) IS 'Normalizes appointment status values to standard enum values';
COMMENT ON FUNCTION trigger_normalize_appointment_status() IS 'Trigger function to automatically normalize appointment status values';