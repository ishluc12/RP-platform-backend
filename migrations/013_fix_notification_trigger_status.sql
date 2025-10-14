-- 013_fix_notification_trigger_status.sql
-- Purpose: Fix notification trigger for appointment status changes to use valid enum values
-- The appointment_status enum includes: 'pending', 'accepted', 'declined', 'completed', 'cancelled', 'rescheduled'
-- Previously the trigger compared against 'approved' and 'rejected', which are NOT enum labels and cause runtime errors.

CREATE OR REPLACE FUNCTION notify_appointment_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status IS DISTINCT FROM OLD.status THEN
        -- Notify the requester when the appointee updates the status
        INSERT INTO notifications (user_id, type, content, source_id, source_table, action_url)
        SELECT 
            NEW.requester_id,
            CASE 
                WHEN NEW.status = 'accepted' THEN 'appointment_approved'
                WHEN NEW.status = 'declined' THEN 'appointment_rejected'
                WHEN NEW.status = 'cancelled' THEN 'appointment_cancelled'
                ELSE 'appointment_updated'
            END,
            CASE 
                WHEN NEW.status = 'accepted' THEN 'Your appointment with ' || u.name || ' was accepted'
                WHEN NEW.status = 'declined' THEN 'Your appointment with ' || u.name || ' was declined'
                WHEN NEW.status = 'cancelled' THEN 'Your appointment with ' || u.name || ' was cancelled'
                ELSE 'Your appointment status was updated'
            END,
            NEW.id,
            'appointments',
            '/appointments'
        FROM users u
        WHERE u.id = NEW.appointee_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Ensure the trigger exists and points to the updated function
DROP TRIGGER IF EXISTS trigger_notify_appointment_status ON appointments;
CREATE TRIGGER trigger_notify_appointment_status
    AFTER UPDATE ON appointments
    FOR EACH ROW
    EXECUTE FUNCTION notify_appointment_status_change();
