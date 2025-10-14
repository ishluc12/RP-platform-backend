-- ============================================================================
-- QUICK FIX FOR CHAT GROUPS AND FILE SHARING
-- Copy and paste this entire file into Supabase SQL Editor and run it
-- ============================================================================

-- Fix 1: Add avatar and description to chat_groups
ALTER TABLE chat_groups ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);
ALTER TABLE chat_groups ADD COLUMN IF NOT EXISTS description TEXT;

-- Fix 2: Add file support to messages
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url VARCHAR(500);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);

-- Fix 3: Update existing groups with default avatars
UPDATE chat_groups 
SET avatar = 'https://ui-avatars.io/api/?name=' || REPLACE(name, ' ', '+') || '&background=random'
WHERE avatar IS NULL;

-- Fix 4: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON messages(group_id);
CREATE INDEX IF NOT EXISTS idx_messages_sent_at ON messages(sent_at DESC);
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON group_members(group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON group_members(user_id);

-- Done! Your database is now ready for group chat and file sharing
