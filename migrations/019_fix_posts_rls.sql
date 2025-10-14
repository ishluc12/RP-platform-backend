-- ===============================================
-- FIX POSTS TABLE RLS POLICIES
-- ===============================================
-- This migration fixes the RLS policies for the posts table

-- Enable RLS on posts table
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view all posts" ON posts;
DROP POLICY IF EXISTS "Users can create their own posts" ON posts;
DROP POLICY IF EXISTS "Users can update their own posts" ON posts;
DROP POLICY IF EXISTS "Users can delete their own posts" ON posts;

-- Create new RLS policies for posts
-- Allow all authenticated users to view posts
CREATE POLICY "Users can view all posts" ON posts
    FOR SELECT
    TO authenticated
    USING (true);

-- Allow authenticated users to create posts
CREATE POLICY "Users can create their own posts" ON posts
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Allow users to update their own posts
CREATE POLICY "Users can update their own posts" ON posts
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Allow users to delete their own posts
CREATE POLICY "Users can delete their own posts" ON posts
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Fix comments table RLS
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all comments" ON comments;
DROP POLICY IF EXISTS "Users can create comments" ON comments;
DROP POLICY IF EXISTS "Users can delete their own comments" ON comments;

CREATE POLICY "Users can view all comments" ON comments
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create comments" ON comments
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own comments" ON comments
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- Fix post_likes table RLS
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view all likes" ON post_likes;
DROP POLICY IF EXISTS "Users can create their own likes" ON post_likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON post_likes;

CREATE POLICY "Users can view all likes" ON post_likes
    FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create their own likes" ON post_likes
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can delete their own likes" ON post_likes
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());
