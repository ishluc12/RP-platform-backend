-- =====================================================

-- APPOINTMENT STATUS ENUM

-- =====================================================

CREATE TYPE appointment_status AS ENUM (

'pending', -- Student booked, waiting for staff response

'accepted', -- Staff accepted the appointment

'declined', -- Staff declined the appointment

'completed', -- Appointment finished

'cancelled', -- Cancelled by either party

'rescheduled' -- Appointment rescheduled

);

-- =====================================================

-- MAIN APPOINTMENTS TABLE

-- =====================================================

CREATE TABLE appointments (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

-- Participants

requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Student booking

appointee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE, -- Staff (lecturer/admin/sys_admin)

-- Appointment Details

appointment_date DATE NOT NULL,

start_time TIME NOT NULL,

end_time TIME NOT NULL,

duration_minutes INTEGER NOT NULL DEFAULT 30,

-- Status & Type

status appointment_status DEFAULT 'pending',

appointment_type VARCHAR(50), -- 'academic_consultation', 'admin_meeting', 'technical_support'

priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'

-- Meeting Information

meeting_type VARCHAR(20) DEFAULT 'in_person', -- 'in_person', 'online'

location VARCHAR(255),

meeting_link TEXT,

-- Content

reason TEXT NOT NULL, -- Why student is booking

student_notes TEXT, -- Additional notes from student

staff_notes TEXT, -- Notes from staff

-- Response tracking

responded_at TIMESTAMP, -- When staff accepted/declined

response_message TEXT, -- Staff's response message

-- Timestamps

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

-- Constraints

CONSTRAINT valid_time_range CHECK (end_time > start_time),

CONSTRAINT valid_duration CHECK (duration_minutes > 0),

CONSTRAINT future_appointment CHECK (appointment_date >= CURRENT_DATE)

);

-- =====================================================

-- STAFF AVAILABILITY SLOTS TABLE

-- =====================================================

CREATE TABLE staff_availability (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

-- Staff member

staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

-- Day & Time

day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0=Sunday, 6=Saturday

start_time TIME NOT NULL,

end_time TIME NOT NULL,

-- Break time (optional)

break_start_time TIME,

break_end_time TIME,

-- Slot Configuration

slot_duration_minutes INTEGER DEFAULT 30, -- How long each appointment slot is

max_appointments_per_slot INTEGER DEFAULT 1, -- How many students per slot

buffer_time_minutes INTEGER DEFAULT 0, -- Buffer between appointments

-- Availability Status

is_active BOOLEAN DEFAULT TRUE,

availability_type VARCHAR(50) DEFAULT 'regular', -- 'regular', 'temporary', 'special'

-- Validity Period

valid_from DATE,

valid_to DATE,

-- Timestamps

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

-- Constraints

CONSTRAINT valid_time_slot CHECK (end_time > start_time),

CONSTRAINT valid_break_time CHECK (

(break_start_time IS NULL AND break_end_time IS NULL) OR

(break_start_time IS NOT NULL AND break_end_time IS NOT NULL AND

break_end_time > break_start_time AND

break_start_time >= start_time AND break_end_time <= end_time)

),

CONSTRAINT valid_duration CHECK (slot_duration_minutes > 0),

CONSTRAINT valid_max_appointments CHECK (max_appointments_per_slot > 0)

);

-- =====================================================

-- AVAILABILITY EXCEPTIONS TABLE

-- =====================================================

CREATE TABLE availability_exceptions (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

-- Staff member

staff_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

-- Exception Details

exception_date DATE NOT NULL,

exception_type VARCHAR(30) DEFAULT 'unavailable', -- 'unavailable', 'modified_hours', 'extra_hours'

-- Modified time (if applicable)

start_time TIME,

end_time TIME,

-- Reason

reason TEXT,

is_recurring BOOLEAN DEFAULT FALSE, -- For recurring exceptions

-- Timestamps

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

-- Constraints

CONSTRAINT valid_exception_time CHECK (

(exception_type = 'unavailable' AND start_time IS NULL AND end_time IS NULL) OR

(exception_type IN ('modified_hours', 'extra_hours') AND end_time > start_time)

),

CONSTRAINT future_exception CHECK (exception_date >= CURRENT_DATE)

);

-- =====================================================

-- APPOINTMENT HISTORY/AUDIT TABLE

-- =====================================================

CREATE TABLE appointment_history (

id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

appointment_id UUID NOT NULL REFERENCES appointments(id) ON DELETE CASCADE,

changed_by UUID NOT NULL REFERENCES users(id),

-- Change Details

old_status appointment_status,

new_status appointment_status,

old_appointment_time TIMESTAMP,

new_appointment_time TIMESTAMP,

action VARCHAR(50), -- 'created', 'accepted', 'declined', 'rescheduled', 'cancelled'

change_reason TEXT,

created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP

);

-- =====================================================

-- INDEXES FOR PERFORMANCE

-- =====================================================

-- Appointments indexes

CREATE INDEX idx_appointments_requester ON appointments(requester_id);

CREATE INDEX idx_appointments_appointee ON appointments(appointee_id);

CREATE INDEX idx_appointments_status ON appointments(status);

CREATE INDEX idx_appointments_date ON appointments(appointment_date);

CREATE INDEX idx_appointments_datetime ON appointments(appointment_date, start_time);

-- Staff availability indexes

CREATE INDEX idx_staff_availability_staff ON staff_availability(staff_id);

CREATE INDEX idx_staff_availability_day ON staff_availability(day_of_week);

CREATE INDEX idx_staff_availability_active ON staff_availability(staff_id, is_active);

-- Availability exceptions indexes

CREATE INDEX idx_availability_exceptions_staff ON availability_exceptions(staff_id);

CREATE INDEX idx_availability_exceptions_date ON availability_exceptions(exception_date);

-- Appointment history indexes

CREATE INDEX idx_appointment_history_appointment ON appointment_history(appointment_id);

CREATE INDEX idx_appointment_history_changed_by ON appointment_history(changed_by);

-- =====================================================

-- TRIGGERS FOR UPDATED_AT

-- =====================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()

RETURNS TRIGGER AS $$

BEGIN

NEW.updated_at = CURRENT_TIMESTAMP;

RETURN NEW;

END;

$$ LANGUAGE plpgsql;

CREATE TRIGGER update_appointments_updated_at

BEFORE UPDATE ON appointments

FOR EACH ROW

EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_staff_availability_updated_at

BEFORE UPDATE ON staff_availability

FOR EACH ROW

EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_availability_exceptions_updated_at

BEFORE UPDATE ON availability_exceptions

FOR EACH ROW

EXECUTE FUNCTION update_updated_at_column();

-- =====================================================

-- TRIGGER FOR APPOINTMENT HISTORY

-- =====================================================

CREATE OR REPLACE FUNCTION log_appointment_changes()

RETURNS TRIGGER AS $$

BEGIN

IF (TG_OP = 'UPDATE') THEN

IF (OLD.status != NEW.status) OR

(OLD.appointment_date != NEW.appointment_date) OR

(OLD.start_time != NEW.start_time) THEN

INSERT INTO appointment_history (

appointment_id,

changed_by,

old_status,

new_status,

old_appointment_time,

new_appointment_time,

action

) VALUES (

NEW.id,

NEW.appointee_id, -- Assuming staff makes changes

OLD.status,

NEW.status,

(OLD.appointment_date + OLD.start_time),

(NEW.appointment_date + NEW.start_time),

CASE

WHEN OLD.status != NEW.status THEN NEW.status::TEXT

ELSE 'rescheduled'

END

);

END IF;

END IF;

RETURN NEW;

END;

$$ LANGUAGE plpgsql;

CREATE TRIGGER log_appointment_changes_trigger

AFTER UPDATE ON appointments

FOR EACH ROW

EXECUTE FUNCTION log_appointment_changes();

    -- ===============================================

    -- COMPLETE APPOINTMENT SYSTEM FIX

    -- ===============================================

    

    -- 1. Fix appointment_status enum to include all necessary values

    DO $$ 

    BEGIN 

        -- Add 'rejected' to the enum if it doesn't exist

        IF NOT EXISTS (

            SELECT 1 FROM pg_enum 

            WHERE enumlabel = 'rejected' 

            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')

        ) THEN

            ALTER TYPE appointment_status ADD VALUE 'rejected';

        END IF;

        

        -- Add 'declined' to the enum if it doesn't exist

        IF NOT EXISTS (

            SELECT 1 FROM pg_enum 

            WHERE enumlabel = 'declined' 

            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')

        ) THEN

            ALTER TYPE appointment_status ADD VALUE 'declined';

        END IF;

        

        -- Add 'cancelled' to the enum if it doesn't exist

        IF NOT EXISTS (

            SELECT 1 FROM pg_enum 

            WHERE enumlabel = 'cancelled' 

            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')

        ) THEN

            ALTER TYPE appointment_status ADD VALUE 'cancelled';

        END IF;

        

        -- Add 'rescheduled' to the enum if it doesn't exist

        IF NOT EXISTS (

            SELECT 1 FROM pg_enum 

            WHERE enumlabel = 'rescheduled' 

            AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')

        ) THEN

            ALTER TYPE appointment_status ADD VALUE 'rescheduled';

        END IF;

    END $$;

    

    -- 2. Fix appointments table - add missing columns

    DO $$ 

    BEGIN 

        -- Add appointment_date column

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'appointments' AND column_name = 'appointment_date'

        ) THEN

            ALTER TABLE appointments ADD COLUMN appointment_date DATE;

            

            -- If appointment_time exists, migrate data

            IF EXISTS (

                SELECT 1 FROM information_schema.columns 

                WHERE table_name = 'appointments' AND column_name = 'appointment_time'

            ) THEN

                UPDATE appointments 

                SET appointment_date = appointment_time::date 

                WHERE appointment_date IS NULL;

            END IF;

        END IF;

        

        -- Add start_time and end_time if they don't exist

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'appointments' AND column_name = 'start_time'

        ) THEN

            ALTER TABLE appointments ADD COLUMN start_time TIME;

        END IF;

        

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'appointments' AND column_name = 'end_time'

        ) THEN

            ALTER TABLE appointments ADD COLUMN end_time TIME;

        END IF;

        

        -- Add other missing columns to appointments

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'appointments' AND column_name = 'student_notes'

        ) THEN

            ALTER TABLE appointments ADD COLUMN student_notes TEXT;

        END IF;

        

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'appointments' AND column_name = 'staff_notes'

        ) THEN

            ALTER TABLE appointments ADD COLUMN staff_notes TEXT;

        END IF;

        

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'appointments' AND column_name = 'responded_at'

        ) THEN

            ALTER TABLE appointments ADD COLUMN responded_at TIMESTAMP;

        END IF;

        

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'appointments' AND column_name = 'response_message'

        ) THEN

            ALTER TABLE appointments ADD COLUMN response_message TEXT;

        END IF;

    END $$;

    

    -- 3. Fix staff_availability table - add missing columns

    DO $$ 

    BEGIN 

        -- Add availability_type column

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'staff_availability' AND column_name = 'availability_type'

        ) THEN

            ALTER TABLE staff_availability ADD COLUMN availability_type VARCHAR(50) DEFAULT 'regular';

        END IF;

        

        -- Add break_start_time

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'staff_availability' AND column_name = 'break_start_time'

        ) THEN

            ALTER TABLE staff_availability ADD COLUMN break_start_time TIME;

        END IF;

        

        -- Add break_end_time

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'staff_availability' AND column_name = 'break_end_time'

        ) THEN

            ALTER TABLE staff_availability ADD COLUMN break_end_time TIME;

        END IF;

        

        -- Add slot_duration_minutes

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'staff_availability' AND column_name = 'slot_duration_minutes'

        ) THEN

            ALTER TABLE staff_availability ADD COLUMN slot_duration_minutes INTEGER DEFAULT 30;

        END IF;

        

        -- Add max_appointments_per_slot

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'staff_availability' AND column_name = 'max_appointments_per_slot'

        ) THEN

            ALTER TABLE staff_availability ADD COLUMN max_appointments_per_slot INTEGER DEFAULT 1;

        END IF;

        

        -- Add buffer_time_minutes

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'staff_availability' AND column_name = 'buffer_time_minutes'

        ) THEN

            ALTER TABLE staff_availability ADD COLUMN buffer_time_minutes INTEGER DEFAULT 0;

        END IF;

        

        -- Add valid_from

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'staff_availability' AND column_name = 'valid_from'

        ) THEN

            ALTER TABLE staff_availability ADD COLUMN valid_from DATE;

        END IF;

        

        -- Add valid_to

        IF NOT EXISTS (

            SELECT 1 FROM information_schema.columns 

            WHERE table_name = 'staff_availability' AND column_name = 'valid_to'

        ) THEN

            ALTER TABLE staff_availability ADD COLUMN valid_to DATE;

        END IF;

    END $$;

    

    -- 4. Update constraints

    ALTER TABLE staff_availability DROP CONSTRAINT IF EXISTS staff_availability_day_of_week_check;

    ALTER TABLE staff_availability ADD CONSTRAINT staff_availability_day_of_week_check 

        CHECK (day_of_week >= 0 AND day_of_week <= 6);

    

    -- 5. Add indexes for better performance

    CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);

    CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);

    CREATE INDEX IF NOT EXISTS idx_appointments_requester ON appointments(requester_id);

    CREATE INDEX IF NOT EXISTS idx_appointments_appointee ON appointments(appointee_id);

    CREATE INDEX IF NOT EXISTS idx_staff_availability_type ON staff_availability(availability_type);

    CREATE INDEX IF NOT EXISTS idx_staff_availability_valid_period ON staff_availability(valid_from, valid_to);

    

    -- 6. Add comments

    COMMENT ON COLUMN appointments.appointment_date IS 'Date of the appointment';

    COMMENT ON COLUMN appointments.start_time IS 'Start time of the appointment';

    COMMENT ON COLUMN appointments.end_time IS 'End time of the appointment';

    COMMENT ON COLUMN appointments.student_notes IS 'Notes from the student';

    COMMENT ON COLUMN appointments.staff_notes IS 'Notes from the staff member';

    COMMENT ON COLUMN staff_availability.availability_type IS 'regular, temporary, special';

    COMMENT ON COLUMN staff_availability.day_of_week IS '0 = Sunday, 6 = Saturday';