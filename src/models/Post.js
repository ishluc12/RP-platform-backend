const { supabase } = require('../config/database');

class PostModel {
    /**
     * Create a new post
     * @param {Object} param0
     * @param {string} param0.user_id
     * @param {string} param0.content
     * @param {string} [param0.description]
     * @param {string} [param0.image_url]
     * @param {string} [param0.video_url]
     * @param {string} [param0.media_type] - 'image', 'video', or null
     * @param {string} [param0.sticker] - Sticker emoji or ID
     * @returns {Promise<Object>}
     */
    static async create({ user_id, content, description = null, image_url = null, video_url = null, media_type = null, sticker = null }) {
        try {
            const { data, error } = await supabase
                .from('posts')
                .insert([{ user_id, content, description, image_url, video_url, media_type, sticker }])
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get paginated feed of posts with user details, likes, and comments (Instagram-style)
     * @param {Object} param0
     * @param {number} [param0.page=1]
     * @param {number} [param0.limit=10]
     * @param {string} [param0.currentUserId] - Current user's ID to check if they liked posts
     * @returns {Promise<Object>}
     */
    static async feed({ page = 1, limit = 10, currentUserId = null } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            // Get posts with user details, like count, and comment count
            const { data: posts, error } = await supabase
                .from('posts')
                .select(`
                    id,
                    content,
                    description,
                    image_url,
                    video_url,
                    media_type,
                    sticker,
                    created_at,
                    user_id,
                    users!posts_user_id_fkey (
                        id,
                        name,
                        email,
                        profile_picture,
                        role,
                        department
                    )
                `)
                .order('created_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            // Format the response to include like/comment counts
            const formattedPosts = await Promise.all(posts.map(async (post) => {
                // Get like count for this post
                const { count: likesCount } = await supabase
                    .from('post_likes')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);
                
                // Get comment count for this post
                const { count: commentsCount } = await supabase
                    .from('comments')
                    .select('*', { count: 'exact', head: true })
                    .eq('post_id', post.id);
                
                // Check if current user liked this post
                let isLikedByCurrentUser = false;
                if (currentUserId) {
                    const { data: userLike } = await supabase
                        .from('post_likes')
                        .select('id')
                        .eq('post_id', post.id)
                        .eq('user_id', currentUserId)
                        .single();
                    isLikedByCurrentUser = !!userLike;
                }

                return {
                    id: post.id,
                    content: post.content,
                    description: post.description,
                    image_url: post.image_url,
                    video_url: post.video_url,
                    media_type: post.media_type,
                    sticker: post.sticker,
                    created_at: post.created_at,
                    user_id: post.user_id,
                    user: post.users, // User data from the join
                    likes_count: likesCount || 0,
                    comments_count: commentsCount || 0,
                    is_liked: isLikedByCurrentUser
                };
            }));

            return { success: true, data: formattedPosts };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get all posts with pagination and optional filters
     * @param {number} [page=1]
     * @param {number} [limit=10]
     * @param {Object} [filters={}]
     * @returns {Promise<Object>}
     */
    static async findAll(page = 1, limit = 10, filters = {}) {
        try {
            let query = supabase.from('posts').select('*, users(id, name, email)', { count: 'exact' }).order('created_at', { ascending: false });

            // Apply filters if needed
            if (filters.user_id) {
                query = query.eq('user_id', filters.user_id);
            }
            if (filters.created_after) {
                query = query.gte('created_at', filters.created_after);
            }

            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error, count } = await query.range(from, to);
            if (error) throw error;

            return {
                success: true,
                data,
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get recent posts by a specific user (paginated)
     * @param {string} userId
     * @param {number} [page=1]
     * @param {number} [limit=10]
     * @returns {Promise<Object>}
     */
    static async findByUser(userId, page = 1, limit = 10) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error } = await supabase
                .from('posts')
                .select('*')
                .eq('user_id', userId)
                .range(from, to);

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Like a post (or upsert if already liked)
     * @param {Object} param0
     * @param {string} param0.post_id
     * @param {string} param0.user_id
     * @returns {Promise<Object>}
     */
    static async like({ post_id, user_id }) {
        try {
            const { data, error } = await supabase
                .from('post_likes')
                .upsert({ post_id, user_id }, { onConflict: 'post_id,user_id' })
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Unlike a post
     * @param {Object} param0
     * @param {string} param0.post_id
     * @param {string} param0.user_id
     * @returns {Promise<Object>}
     */
    static async unlike({ post_id, user_id }) {
        try {
            const { data, error } = await supabase
                .from('post_likes')
                .delete()
                .match({ post_id, user_id })
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get a single post by ID, with like and comment counts
     * @param {string} postId
     * @returns {Promise<Object>}
     */
    static async getById(postId) {
        try {
            const { data: post, error } = await supabase
                .from('posts')
                .select(`
                    *,
                    users (id, name, email, profile_picture),
                    likes_count:post_likes(count),
                    comments_count:comments(count)
                `)
                .eq('id', postId)
                .single();

            if (error) throw error;

            const formattedPost = {
                ...post,
                likes_count: post.likes_count[0]?.count || 0,
                comments_count: post.comments_count[0]?.count || 0,
                user: post.users
            };
            delete formattedPost.users; // Remove original users object

            return { success: true, data: formattedPost };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Update an existing post
     * @param {number} postId
     * @param {number} userId - The ID of the user trying to update (for authorization)
     * @param {Object} updates - Object containing fields to update (e.g., { content: 'new content' })
     * @returns {Promise<Object>}
     */
    static async update(postId, userId, updates) {
        try {
            const { data, error } = await supabase
                .from('posts')
                .update(updates)
                .eq('id', postId)
                .eq('user_id', userId) // Ensure only the owner can update
                .select('*')
                .single();

            if (error) throw error;

            if (!data) return { success: false, error: 'Post not found or unauthorized to update' };

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Delete a post
     * @param {number} postId
     * @param {number} userId - The ID of the user trying to delete (for authorization)
     * @returns {Promise<Object>}
     */
    static async delete(postId, userId) {
        try {
            const { data, error } = await supabase
                .from('posts')
                .delete()
                .eq('id', postId)
                .eq('user_id', userId) // Ensure only the owner can delete
                .select('*')
                .single();

            if (error) throw error;

            if (!data) return { success: false, error: 'Post not found or unauthorized to delete' };

            return { success: true, data: { message: 'Post deleted successfully' } };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }
}

module.exports = PostModel;
