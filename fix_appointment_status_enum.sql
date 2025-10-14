-- ===============================================
-- FIX APPOINTMENT STATUS ENUM
-- ===============================================
-- This script fixes the appointment_status enum to match frontend expectations

-- First, let's check what the current enum values are
SELECT unnest(enum_range(NULL::appointment_status)) as current_values;

-- Update the enum to include all necessary values
-- We need to add 'rejected' and 'declined' to match frontend expectations
DO $$ 
BEGIN 
    -- Check if 'rejected' exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'rejected' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')
    ) THEN
        -- Add 'rejected' to the enum
        ALTER TYPE appointment_status ADD VALUE 'rejected';
    END IF;
    
    -- Check if 'declined' exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'declined' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')
    ) THEN
        -- Add 'declined' to the enum
        ALTER TYPE appointment_status ADD VALUE 'declined';
    END IF;
    
    -- Check if 'cancelled' exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'cancelled' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')
    ) THEN
        -- Add 'cancelled' to the enum
        ALTER TYPE appointment_status ADD VALUE 'cancelled';
    END IF;
    
    -- Check if 'rescheduled' exists in the enum
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'rescheduled' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')
    ) THEN
        -- Add 'rescheduled' to the enum
        ALTER TYPE appointment_status ADD VALUE 'rescheduled';
    END IF;
END $$;

-- Verify the updated enum values
SELECT unnest(enum_range(NULL::appointment_status)) as updated_values;

-- Add comments to clarify the enum values
COMMENT ON TYPE appointment_status IS 'Appointment status values: pending, accepted, rejected, declined, completed, cancelled, rescheduled';
