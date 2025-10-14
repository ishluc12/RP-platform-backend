-- Migration to add source_id and source_table to notifications table
-- Add source_id column (UUID, nullable) to notifications
ALTER TABLE notifications
ADD COLUMN source_id UUID;
-- Add source_table column (VARCHAR, nullable) to notifications
ALTER TABLE notifications
ADD COLUMN source_table VARCHAR(50);
-- Add index for better query performance when filtering by source_id
CREATE INDEX idx_notifications_source_id ON notifications(source_id);
-- Add comment to document the new columns
COMMENT ON COLUMN notifications.source_id IS 'ID of the entity that triggered the notification (e.g., event ID, message ID)';
COMMENT ON COLUMN notifications.source_table IS 'Table name of the entity that triggered the notification (e.g., events, messages)';