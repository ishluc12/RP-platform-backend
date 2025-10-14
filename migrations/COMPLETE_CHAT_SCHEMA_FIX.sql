-- ============================================================================
-- COMPLETE CHAT SCHEMA FIX
-- This file contains all necessary queries to fix chat groups and add file sharing
-- ============================================================================

-- Step 1: Add missing columns to chat_groups table
-- ============================================================================
ALTER TABLE chat_groups 
ADD COLUMN IF NOT EXISTS avatar VARCHAR(500),
ADD COLUMN IF NOT EXISTS description TEXT;

-- Step 2: Add file-related columns to messages table
-- ============================================================================
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS file_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS file_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS file_size INTEGER,
ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);

-- Step 3: Create indexes for better performance
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_message_type ON messages(message_type);

-- Step 4: Create indexes for group members
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- Step 5: Add unique constraint to prevent duplicate group memberships
-- ============================================================================
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'unique_group_member'
    ) THEN
        ALTER TABLE group_members 
        ADD CONSTRAINT unique_group_member 
        UNIQUE (group_id, user_id);
    END IF;
END $$;

-- Step 6: Update existing chat_groups to have default avatar if null
-- ============================================================================
UPDATE chat_groups 
SET avatar = 'https://ui-avatars.io/api/?name=' || REPLACE(name, ' ', '+') || '&background=random'
WHERE avatar IS NULL;

-- Step 7: Add comments for documentation
-- ============================================================================
COMMENT ON COLUMN chat_groups.avatar IS 'URL to group profile picture';
COMMENT ON COLUMN chat_groups.description IS 'Group description or purpose';
COMMENT ON COLUMN messages.file_url IS 'URL to uploaded file (if message_type is file or image)';
COMMENT ON COLUMN messages.file_name IS 'Original filename of uploaded file';
COMMENT ON COLUMN messages.file_size IS 'File size in bytes';
COMMENT ON COLUMN messages.file_type IS 'MIME type of the file';

-- Step 8: Create a function to get group conversations with latest message
-- ============================================================================
CREATE OR REPLACE FUNCTION get_user_group_conversations(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    name VARCHAR,
    avatar VARCHAR,
    description TEXT,
    created_by UUID,
    created_at TIMESTAMP,
    last_message_content TEXT,
    last_message_sent_at TIMESTAMP,
    last_message_sender_id UUID,
    member_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        cg.id,
        cg.name,
        cg.avatar,
        cg.description,
        cg.created_by,
        cg.created_at,
        lm.message AS last_message_content,
        lm.sent_at AS last_message_sent_at,
        lm.sender_id AS last_message_sender_id,
        (SELECT COUNT(*) FROM group_members WHERE group_id = cg.id) AS member_count
    FROM chat_groups cg
    INNER JOIN group_members gm ON cg.id = gm.group_id
    LEFT JOIN LATERAL (
        SELECT message, sent_at, sender_id
        FROM messages
        WHERE group_id = cg.id AND is_group = TRUE
        ORDER BY sent_at DESC
        LIMIT 1
    ) lm ON TRUE
    WHERE gm.user_id = p_user_id
    ORDER BY lm.sent_at DESC NULLS LAST;
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create a view for messages with file information
-- ============================================================================
CREATE OR REPLACE VIEW messages_with_files AS
SELECT 
    m.id,
    m.sender_id,
    m.receiver_id,
    m.message,
    m.is_group,
    m.group_id,
    m.is_read,
    m.message_type,
    m.sent_at,
    m.file_url,
    m.file_name,
    m.file_size,
    m.file_type,
    u.name AS sender_name,
    u.profile_picture AS sender_profile_picture
FROM messages m
LEFT JOIN users u ON m.sender_id = u.id;

-- ============================================================================
-- VERIFICATION QUERIES
-- Run these to verify the migration was successful
-- ============================================================================

-- Verify chat_groups columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'chat_groups'
ORDER BY ordinal_position;

-- Verify messages columns
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'messages'
ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('messages', 'group_members', 'chat_groups')
ORDER BY tablename, indexname;

-- ============================================================================
-- SAMPLE QUERIES FOR FILE SHARING
-- ============================================================================

-- Insert a text message (existing functionality)
-- INSERT INTO messages (sender_id, receiver_id, message, message_type, is_group)
-- VALUES ('user-uuid-here', 'receiver-uuid-here', 'Hello!', 'text', FALSE);

-- Insert a file message (new functionality)
-- INSERT INTO messages (sender_id, receiver_id, message, message_type, is_group, file_url, file_name, file_size, file_type)
-- VALUES (
--     'user-uuid-here', 
--     'receiver-uuid-here', 
--     'Shared a file', 
--     'file', 
--     FALSE,
--     'https://storage.example.com/files/document.pdf',
--     'document.pdf',
--     1024000,
--     'application/pdf'
-- );

-- Insert a group file message
-- INSERT INTO messages (sender_id, group_id, message, message_type, is_group, file_url, file_name, file_size, file_type)
-- VALUES (
--     'user-uuid-here', 
--     'group-uuid-here', 
--     'Shared a file with the group', 
--     'file', 
--     TRUE,
--     'https://storage.example.com/files/image.jpg',
--     'image.jpg',
--     512000,
--     'image/jpeg'
-- );

-- Get all messages with files in a conversation
-- SELECT * FROM messages_with_files
-- WHERE (sender_id = 'user1-uuid' AND receiver_id = 'user2-uuid')
--    OR (sender_id = 'user2-uuid' AND receiver_id = 'user1-uuid')
-- ORDER BY sent_at ASC;

-- Get all file messages in a group
-- SELECT * FROM messages_with_files
-- WHERE group_id = 'group-uuid-here' AND is_group = TRUE
-- ORDER BY sent_at ASC;
