-- Migration 011: Fix chat_groups table and add file support to messages
-- This migration adds missing columns to chat_groups and messages tables

-- Add avatar column to chat_groups table
ALTER TABLE chat_groups 
ADD COLUMN IF NOT EXISTS avatar VARCHAR(500),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add file-related columns to messages table
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS file_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);

-- Create index for faster message queries
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);

-- Create index for group members
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- Add unique constraint to prevent duplicate group memberships
ALTER TABLE group_members 
ADD CONSTRAINT IF NOT EXISTS unique_group_member 
UNIQUE (group_id, user_id);

-- Update existing chat_groups to have default avatar if null
UPDATE chat_groups 
SET avatar = 'https://ui-avatars.io/api/?name=' || REPLACE(name, ' ', '+') || '&background=random'
WHERE avatar IS NULL;

COMMENT ON COLUMN chat_groups.avatar IS 'URL to group profile picture';
COMMENT ON COLUMN chat_groups.description IS 'Group description or purpose';
COMMENT ON COLUMN messages.file_url IS 'URL to uploaded file (if message_type is file or image)';
COMMENT ON COLUMN messages.file_name IS 'Original filename of uploaded file';
COMMENT ON COLUMN messages.file_size IS 'File size in bytes';
COMMENT ON COLUMN messages.file_type IS 'MIME type of the file';
