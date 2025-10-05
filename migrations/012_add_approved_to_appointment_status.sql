-- 012_add_approved_to_appointment_status.sql
-- Purpose: Allow 'approved' as a valid appointment_status to support legacy/front-end payloads.
-- Note: We insert 'approved' before 'accepted' for sensible enum ordering.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_type t
    JOIN pg_enum e ON t.oid = e.enumtypid
    WHERE t.typname = 'appointment_status'
      AND e.enumlabel = 'approved'
  ) THEN
    ALTER TYPE appointment_status ADD VALUE IF NOT EXISTS 'approved' BEFORE 'accepted';
  END IF;
END
$$;