-- =====================================================
-- COMPLETE APPOINTMENT SYSTEM RECONSTRUCTION
-- =====================================================
-- This migration completely rebuilds the appointment system with the new schema
-- Drop existing appointment-related tables and types
DROP TABLE IF EXISTS appointment_history CASCADE;
DROP TABLE IF EXISTS availability_exceptions CASCADE;
DROP TABLE IF EXISTS staff_availability CASCADE;
DROP TABLE IF EXISTS appointments CASCADE;
DROP TYPE IF EXISTS appointment_status CASCADE;
-- =====================================================
-- APPOINTMENT STATUS ENUM
-- =====================================================
CREATE TYPE appointment_status AS ENUM (
    'pending',
    -- Student booked, waiting for staff response
    'accepted',
    -- Staff accepted the appointment
    'declined',
    -- Staff declined the appointment
    'completed',
    -- Appointment finished
    'cancelled',
    -- Cancelled by either party
    'rescheduled' -- Appointment rescheduled
);
-- =====================================================
-- MAIN APPOINTMENTS TABLE
-- =====================================================
CREATE TABLE appointments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- Participants
    requester_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Student booking
    appointee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    -- Staff (lecturer/admin/sys_admin)
    -- Appointment Details
    appointment_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL DEFAULT 30,
    -- Status & Type
    status appointment_status DEFAULT 'pending',
    appointment_type VARCHAR(50),
    -- 'academic_consultation', 'admin_meeting', 'technical_support'
    priority VARCHAR(20) DEFAULT 'normal',
    -- 'low', 'normal', 'high', 'urgent'
    -- Meeting Information
    meeting_type VARCHAR(20) DEFAULT 'in_person',
    -- 'in_person', 'online'
    location VARCHAR(255),
    meeting_link TEXT,
    -- Content
    reason TEXT NOT NULL,
    -- Why student is booking
    student_notes TEXT,
    -- Additional notes from student
    staff_notes TEXT,
    -- Notes from staff
    -- Response tracking
    responded_at TIMESTAMP,
    -- When staff accepted/declined
    response_message TEXT,
    -- Staff's response message
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
    day_of_week INTEGER NOT NULL CHECK (
        day_of_week >= 0
        AND day_of_week <= 6
    ),
    -- 0=Sunday, 6=Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    -- Break time (optional)
    break_start_time TIME,
    break_end_time TIME,
    -- Slot Configuration
    slot_duration_minutes INTEGER DEFAULT 30,
    -- How long each appointment slot is
    max_appointments_per_slot INTEGER DEFAULT 1,
    -- How many students per slot
    buffer_time_minutes INTEGER DEFAULT 0,
    -- Buffer between appointments
    -- Availability Status
    is_active BOOLEAN DEFAULT TRUE,
    availability_type VARCHAR(50) DEFAULT 'regular',
    -- 'regular', 'temporary', 'special'
    -- Validity Period
    valid_from DATE,
    valid_to DATE,
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Constraints
    CONSTRAINT valid_time_slot CHECK (end_time > start_time),
    CONSTRAINT valid_break_time CHECK (
        (
            break_start_time IS NULL
            AND break_end_time IS NULL
        )
        OR (
            break_start_time IS NOT NULL
            AND break_end_time IS NOT NULL
            AND break_end_time > break_start_time
            AND break_start_time >= start_time
            AND break_end_time <= end_time
        )
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
    exception_type VARCHAR(30) DEFAULT 'unavailable',
    -- 'unavailable', 'modified_hours', 'extra_hours'
    -- Modified time (if applicable)
    start_time TIME,
    end_time TIME,
    -- Reason
    reason TEXT,
    is_recurring BOOLEAN DEFAULT FALSE,
    -- For recurring exceptions
    -- Timestamps
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    -- Constraints
    CONSTRAINT valid_exception_time CHECK (
        (
            exception_type = 'unavailable'
            AND start_time IS NULL
            AND end_time IS NULL
        )
        OR (
            exception_type IN ('modified_hours', 'extra_hours')
            AND end_time > start_time
        )
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
    action VARCHAR(50),
    -- 'created', 'accepted', 'declined', 'rescheduled', 'cancelled'
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
CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = CURRENT_TIMESTAMP;
RETURN NEW;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER update_appointments_updated_at BEFORE
UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_staff_availability_updated_at BEFORE
UPDATE ON staff_availability FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_availability_exceptions_updated_at BEFORE
UPDATE ON availability_exceptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
-- =====================================================
-- TRIGGER FOR APPOINTMENT HISTORY
-- =====================================================
CREATE OR REPLACE FUNCTION log_appointment_changes() RETURNS TRIGGER AS $$ BEGIN IF (TG_OP = 'UPDATE') THEN IF (OLD.status != NEW.status)
    OR (OLD.appointment_date != NEW.appointment_date)
    OR (OLD.start_time != NEW.start_time) THEN
INSERT INTO appointment_history (
        appointment_id,
        changed_by,
        old_status,
        new_status,
        old_appointment_time,
        new_appointment_time,
        action
    )
VALUES (
        NEW.id,
        NEW.appointee_id,
        -- Assuming staff makes changes
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
AFTER
UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION log_appointment_changes();
-- =====================================================
-- ROW LEVEL SECURITY POLICIES
-- =====================================================
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_availability ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_exceptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointment_history ENABLE ROW LEVEL SECURITY;
-- Appointments policies
CREATE POLICY "Users can view their own appointments" ON appointments FOR
SELECT TO authenticated USING (
        requester_id = auth.uid()
        OR appointee_id = auth.uid()
    );
CREATE POLICY "Students can create appointments" ON appointments FOR
INSERT TO authenticated WITH CHECK (requester_id = auth.uid());
CREATE POLICY "Staff can update appointments they're assigned to" ON appointments FOR
UPDATE TO authenticated USING (appointee_id = auth.uid()) WITH CHECK (appointee_id = auth.uid());
CREATE POLICY "Users can cancel their own appointments" ON appointments FOR
UPDATE TO authenticated USING (
        requester_id = auth.uid()
        OR appointee_id = auth.uid()
    ) WITH CHECK (
        requester_id = auth.uid()
        OR appointee_id = auth.uid()
    );
-- Staff availability policies
CREATE POLICY "Staff can manage their own availability" ON staff_availability FOR ALL TO authenticated USING (staff_id = auth.uid()) WITH CHECK (staff_id = auth.uid());
CREATE POLICY "Anyone can view active availability" ON staff_availability FOR
SELECT TO authenticated USING (is_active = true);
-- Availability exceptions policies
CREATE POLICY "Staff can manage their own exceptions" ON availability_exceptions FOR ALL TO authenticated USING (staff_id = auth.uid()) WITH CHECK (staff_id = auth.uid());
CREATE POLICY "Anyone can view exceptions" ON availability_exceptions FOR
SELECT TO authenticated USING (true);
-- Appointment history policies
CREATE POLICY "Users can view history of their appointments" ON appointment_history FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM appointments
            WHERE id = appointment_history.appointment_id
                AND (
                    requester_id = auth.uid()
                    OR appointee_id = auth.uid()
                )
        )
    );
-- =====================================================
-- HELPFUL FUNCTIONS
-- =====================================================
-- Function to get available time slots for a staff member on a specific date
CREATE OR REPLACE FUNCTION get_available_slots(p_staff_id UUID, p_date DATE) RETURNS TABLE (
        start_time TIME,
        end_time TIME,
        slot_duration INTEGER
    ) AS $$ BEGIN RETURN QUERY
SELECT sa.start_time,
    sa.end_time,
    sa.slot_duration_minutes
FROM staff_availability sa
WHERE sa.staff_id = p_staff_id
    AND sa.is_active = true
    AND sa.day_of_week = EXTRACT(
        DOW
        FROM p_date
    )
    AND (
        sa.valid_from IS NULL
        OR sa.valid_from <= p_date
    )
    AND (
        sa.valid_to IS NULL
        OR sa.valid_to >= p_date
    )
    AND NOT EXISTS (
        SELECT 1
        FROM availability_exceptions ae
        WHERE ae.staff_id = p_staff_id
            AND ae.exception_date = p_date
            AND ae.exception_type = 'unavailable'
    )
ORDER BY sa.start_time;
END;
$$ LANGUAGE plpgsql;
-- Function to check if a time slot is available
CREATE OR REPLACE FUNCTION is_slot_available(
        p_staff_id UUID,
        p_date DATE,
        p_start_time TIME,
        p_end_time TIME
    ) RETURNS BOOLEAN AS $$
DECLARE existing_count INTEGER;
BEGIN -- Check if there are existing appointments in this time slot
SELECT COUNT(*) INTO existing_count
FROM appointments a
WHERE a.appointee_id = p_staff_id
    AND a.appointment_date = p_date
    AND a.status IN ('pending', 'accepted')
    AND (
        (
            a.start_time < p_end_time
            AND a.end_time > p_start_time
        )
    );
-- Check if staff has availability for this time
IF NOT EXISTS (
    SELECT 1
    FROM staff_availability sa
    WHERE sa.staff_id = p_staff_id
        AND sa.day_of_week = EXTRACT(
            DOW
            FROM p_date
        )
        AND sa.is_active = true
        AND sa.start_time <= p_start_time
        AND sa.end_time >= p_end_time
        AND (
            sa.valid_from IS NULL
            OR sa.valid_from <= p_date
        )
        AND (
            sa.valid_to IS NULL
            OR sa.valid_to >= p_date
        )
) THEN RETURN FALSE;
END IF;
-- Check for exceptions
IF EXISTS (
    SELECT 1
    FROM availability_exceptions ae
    WHERE ae.staff_id = p_staff_id
        AND ae.exception_date = p_date
        AND ae.exception_type = 'unavailable'
) THEN RETURN FALSE;
END IF;
RETURN existing_count = 0;
END;
$$ LANGUAGE plpgsql;
-- Add comments for documentation
COMMENT ON TABLE appointments IS 'Main appointments table with complete appointment lifecycle management';
COMMENT ON TABLE staff_availability IS 'Staff availability slots for appointment booking';
COMMENT ON TABLE availability_exceptions IS 'Exceptions to regular availability (holidays, sick days, etc.)';
COMMENT ON TABLE appointment_history IS 'Audit trail for all appointment changes';
COMMENT ON FUNCTION get_available_slots(UUID, DATE) IS 'Returns available time slots for a staff member on a specific date';
COMMENT ON FUNCTION is_slot_available(UUID, DATE, TIME, TIME) IS 'Checks if a specific time slot is available for booking';