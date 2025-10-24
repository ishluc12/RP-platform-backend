const { supabase, supabaseAdmin } = require('../config/database');

// Prefer service-role client to bypass RLS on server-side trusted operations
const db = supabaseAdmin || supabase;

class User {
    /** Create a new user */
    static async create(userData) {
        try {
            // Extract all relevant fields from userData
            const {
                name,
                email,
                password_hash,
                role = 'student',
                profile_picture,
                bio,
                phone,
                department,
                student_id,
                staff_id,
                // supabase_auth_id
            } = userData;

            const insertData = {
                name,
                email,
                password_hash,
                role,
                profile_picture,
                bio,
                phone: phone || null,
                department: department || null,
                student_id: student_id || null,
                staff_id: staff_id || null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                // supabase_auth_id: supabase_auth_id || null
            };

            const { data, error } = await db
                .from('users')
                .insert([insertData])
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Get user by ID */
    static async findById(id) {
        try {
            const { data, error } = await db
                .from('users')
                .select('*')
                .eq('id', id)
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Get user by email */
    static async findByEmail(email) {
        try {
            const { data, error } = await db
                .from('users')
                .select('*')
                .eq('email', email)
                .single();
            if (error) {
                // If no row is found, Supabase returns error.code 'PGRST116'
                if (error.code === 'PGRST116') {
                    return { success: false, error: 'User not found' };
                }
                // If multiple rows are found, or other errors
                return { success: false, error: error.message || 'Multiple users found or unknown error' };
            }
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Get users with pagination and optional filters */
    static async findAll(page = 1, limit = 10, filters = {}) {
        try {
            let query = db.from('users').select('*', { count: 'exact' }).order('created_at', { ascending: false });

            if (filters.role) query = query.eq('role', filters.role);
            if (filters.department) query = query.eq('department', filters.department);
            if (filters.search) query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
            if (filters.created_after) query = query.gte('created_at', filters.created_after);
            if (filters.status) {
                // Map status to is_active boolean; treat 'blocked' as inactive
                const wantActive = String(filters.status).toLowerCase() === 'active';
                query = query.eq('is_active', wantActive);
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

    /** Update user by ID */
    static async update(id, updateData) {
        // Only update allowed fields!
        const allowedFields = ['name', 'role', 'profile_picture', 'bio', 'phone', 'department', 'student_id', 'staff_id', 'is_active', 'suspension_reason', 'status'];
        const filteredUpdate = {};
        allowedFields.forEach(field => {
            if (updateData[field] !== undefined) filteredUpdate[field] = updateData[field];
        });
        filteredUpdate.updated_at = new Date().toISOString();

        try {
            const { data, error } = await db
                .from('users')
                .update(filteredUpdate)
                .eq('id', id)
                .select()
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Delete user by ID - with cascading deletion of related records */
    static async delete(id) {
        try {
            const { supabase, supabaseAdmin } = require('../config/database');
            const db = supabaseAdmin || supabase;
            
            // Start a transaction-like approach by deleting related records first
            // Delete related appointments where user is requester or appointee
            const { error: appointmentError } = await db
                .from('appointments')
                .delete()
                .or(`requester_id.eq.${id},appointee_id.eq.${id}`);
            
            if (appointmentError) {
                console.error('Error deleting user appointments:', appointmentError);
                // Continue with user deletion even if appointments deletion fails
            }
            
            // Delete related availability records
            const { error: availabilityError } = await db
                .from('staff_availability')
                .delete()
                .eq('staff_id', id);
            
            if (availabilityError) {
                console.error('Error deleting user availability:', availabilityError);
                // Continue with user deletion even if availability deletion fails
            }
            
            // Delete related appointment exceptions
            const { error: exceptionError } = await db
                .from('appointment_exceptions')
                .delete()
                .eq('staff_id', id);
            
            if (exceptionError) {
                console.error('Error deleting user exceptions:', exceptionError);
                // Continue with user deletion even if exceptions deletion fails
            }
            
            // Delete related posts
            const { error: postError } = await db
                .from('posts')
                .delete()
                .eq('user_id', id);
            
            if (postError) {
                console.error('Error deleting user posts:', postError);
                // Continue with user deletion even if posts deletion fails
            }
            
            // Delete related comments
            const { error: commentError } = await db
                .from('comments')
                .delete()
                .eq('user_id', id);
            
            if (commentError) {
                console.error('Error deleting user comments:', commentError);
                // Continue with user deletion even if comments deletion fails
            }
            
            // Delete related events
            const { error: eventError } = await db
                .from('events')
                .delete()
                .eq('created_by', id);
            
            if (eventError) {
                console.error('Error deleting user events:', eventError);
                // Continue with user deletion even if events deletion fails
            }
            
            // Delete related notifications
            const { error: notificationError } = await db
                .from('notifications')
                .delete()
                .or(`user_id.eq.${id},sender_id.eq.${id}`);
            
            if (notificationError) {
                console.error('Error deleting user notifications:', notificationError);
                // Continue with user deletion even if notifications deletion fails
            }
            
            // Delete related messages
            const { error: messageError } = await db
                .from('messages')
                .delete()
                .or(`sender_id.eq.${id},recipient_id.eq.${id}`);
            
            if (messageError) {
                console.error('Error deleting user messages:', messageError);
                // Continue with user deletion even if messages deletion fails
            }
            
            // Delete related chat group memberships
            const { error: chatGroupError } = await db
                .from('chat_group_members')
                .delete()
                .eq('user_id', id);
            
            if (chatGroupError) {
                console.error('Error deleting user chat group memberships:', chatGroupError);
                // Continue with user deletion even if chat group memberships deletion fails
            }
            
            // Delete related forum posts
            const { error: forumPostError } = await db
                .from('forum_posts')
                .delete()
                .eq('author_id', id);
            
            if (forumPostError) {
                console.error('Error deleting user forum posts:', forumPostError);
                // Continue with user deletion even if forum posts deletion fails
            }
            
            // Delete related surveys
            const { error: surveyError } = await db
                .from('surveys')
                .delete()
                .eq('created_by', id);
            
            if (surveyError) {
                console.error('Error deleting user surveys:', surveyError);
                // Continue with user deletion even if surveys deletion fails
            }
            
            // Delete related survey responses
            const { error: surveyResponseError } = await db
                .from('survey_responses')
                .delete()
                .eq('user_id', id);
            
            if (surveyResponseError) {
                console.error('Error deleting user survey responses:', surveyResponseError);
                // Continue with user deletion even if survey responses deletion fails
            }
            
            // Delete related poll votes
            const { error: pollVoteError } = await db
                .from('poll_votes')
                .delete()
                .eq('user_id', id);
            
            if (pollVoteError) {
                console.error('Error deleting user poll votes:', pollVoteError);
                // Continue with user deletion even if poll votes deletion fails
            }
            
            // Finally, delete the user
            const { error: userError } = await db
                .from('users')
                .delete()
                .eq('id', id);
                
            if (userError) throw userError;
            
            return { success: true, message: 'User and all related records deleted successfully' };
        } catch (error) {
            console.error('Error deleting user:', error);
            return { success: false, error: error.message || 'Failed to delete user and related records' };
        }
    }

    /** Update profile picture */
    static async updateProfilePicture(id, profilePictureUrl) {
        try {
            const { data, error } = await db
                .from('users')
                .update({ profile_picture: profilePictureUrl, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select('id, profile_picture')
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Change password */
    static async changePassword(id, newPasswordHash) {
        try {
            const { data, error } = await db
                .from('users')
                .update({ password_hash: newPasswordHash, updated_at: new Date().toISOString() })
                .eq('id', id)
                .select('id')
                .single();
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Get user statistics grouped by role and department */
    static async getStats() {
        try {
            const { data, error } = await db.from('users').select('role, department');
            if (error) throw error;

            const stats = { total: data.length, byRole: {}, byDepartment: {} };
            data.forEach(user => {
                stats.byRole[user.role] = (stats.byRole[user.role] || 0) + 1;
                if (user.department) stats.byDepartment[user.department] = (stats.byDepartment[user.department] || 0) + 1;
            });

            return { success: true, data: stats };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Get user by student_id */
    static async findByStudentId(studentId) {
        try {
            const { data, error } = await db
                .from('users')
                .select('*')
                .eq('student_id', studentId)
                .single();
            if (error && error.code === 'PGRST116') return { success: false, error: 'User not found' };
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Get user by staff_id */
    static async findByStaffId(staffId) {
        try {
            const { data, error } = await db
                .from('users')
                .select('*')
                .eq('staff_id', staffId)
                .single();
            if (error && error.code === 'PGRST116') return { success: false, error: 'User not found' };
            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /** Get users by role */
    static async findByRole(role, page = 1, limit = 10) {
        try {
            let query = db.from('users').select('*', { count: 'exact' }).eq('role', role).order('created_at', { ascending: false });

            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error, count } = await query.range(from, to);
            if (error) throw error;

            return {
                success: true,
                data: data || [], // Ensure data is always an array
                pagination: {
                    page,
                    limit,
                    total: count,
                    totalPages: Math.ceil(count / limit)
                }
            };
        } catch (error) {
            console.error('Error in User.findByRole:', error);
            return { success: false, error: error.message || 'Unknown error' };
        }
    }
}

// Additional helpers
User.listStudentsByDepartment = async (department) => {
    try {
        const { supabase, supabaseAdmin } = require('../config/database');
        const db = supabaseAdmin || supabase;
        let query = db.from('users').select('id').eq('role', 'student');
        if (department) query = query.eq('department', department);
        const { data, error } = await query;
        if (error) throw error;
        return { success: true, data };
    } catch (error) {
        return { success: false, error: error.message || 'Unknown error' };
    }
};

module.exports = User;