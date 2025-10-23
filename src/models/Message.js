
const { supabase, supabaseAdmin } = require('../config/database');
const { logger } = require('../utils/logger');

const db = supabaseAdmin || supabase;

const TABLE_NAME = 'messages';

class Message {
    static async getDirectThread(userId1, userId2, { page = 1, limit = 50 }) {
        try {
            const offset = (page - 1) * limit;
            const { data, error, count } = await db
                .from(TABLE_NAME)
                .select(`
                    id,
                    sender_id,
                    receiver_id,
                    group_id,
                    is_group,
                    message,
                    message_type,
                    file_name,
                    file_type,
                    file_size,
                    file_url,
                    sent_at,
                    is_read,
                    sender:users!messages_sender_id_fkey ( id, name, profile_picture, role )
                `, { count: 'exact' })
                .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
                .order('sent_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                logger.error('Error fetching direct message thread from DB:', error);
                return { success: false, error: error.message };
            }

            const totalPages = Math.ceil(count / limit);

            return {
                success: true,
                data: (data || []).reverse(),
                pagination: {
                    currentPage: page,
                    limit,
                    totalItems: count,
                    totalPages
                }
            };
        } catch (error) {
            logger.error('Exception in getDirectThread:', error);
            return { success: false, error: error.message };
        }
    }

    static async create(messageData) {
        try {
            const { data, error } = await db
                .from(TABLE_NAME)
                .insert([messageData])
                .select();

            if (error) {
                logger.error('Error inserting message into DB:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data: data[0] };
        } catch (error) {
            logger.error('Exception in create message:', error);
            return { success: false, error: error.message };
        }
    }

    static async getGroupMessages(groupId, { page = 1, limit = 50 }) {
        try {
            const offset = (page - 1) * limit;
            const { data, error, count } = await db
                .from(TABLE_NAME)
                .select(`
                    id,
                    sender_id,
                    receiver_id,
                    group_id,
                    is_group,
                    message,
                    message_type,
                    file_name,
                    file_type,
                    file_size,
                    file_url,
                    sent_at,
                    is_read,
                    sender:users!messages_sender_id_fkey ( id, name, profile_picture, role )
                `, { count: 'exact' })
                .eq('group_id', groupId)
                .eq('is_group', true)
                .order('sent_at', { ascending: false })
                .range(offset, offset + limit - 1);

            if (error) {
                logger.error('Error fetching group messages from DB:', error);
                return { success: false, error: error.message };
            }

            const totalPages = Math.ceil(count / limit);

            return {
                success: true,
                data: (data || []).reverse(),
                pagination: {
                    currentPage: page,
                    limit,
                    totalItems: count,
                    totalPages
                }
            };
        } catch (error) {
            logger.error('Exception in getGroupMessages:', error);
            return { success: false, error: error.message };
        }
    }

    static async getUserConversations(userId) {
        try {
            // Get all direct messages involving this user
            const { data: allMessages, error: messagesError } = await db
                .from(TABLE_NAME)
                .select('*')
                .eq('is_group', false)
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .order('sent_at', { ascending: false });

            if (messagesError) {
                logger.error('Error fetching user messages:', messagesError);
                return { success: false, error: messagesError.message };
            }

            if (!allMessages || allMessages.length === 0) {
                return { success: true, data: [] };
            }

            // Group messages by conversation partner
            const conversationsMap = new Map();
            
            for (const msg of allMessages) {
                const partnerId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
                
                if (!partnerId) continue;
                
                // Only keep the latest message per partner
                if (!conversationsMap.has(partnerId)) {
                    conversationsMap.set(partnerId, {
                        other_user_id: partnerId,
                        last_message_content: msg.message,
                        last_message_sent_at: msg.sent_at,
                        last_message_id: msg.id
                    });
                }
            }

            const partnerIds = Array.from(conversationsMap.keys());

            if (partnerIds.length === 0) {
                return { success: true, data: [] };
            }

            // Fetch user details for all partners
            const { data: users, error: usersError } = await db
                .from('users')
                .select('id, name, profile_picture, role')
                .in('id', partnerIds);

            if (usersError) {
                logger.error('Error fetching conversation partners:', usersError);
                return { success: false, error: usersError.message };
            }

            // Combine user data with conversation data
            const conversations = users.map(user => {
                const convData = conversationsMap.get(user.id);
                return {
                    other_user_id: user.id,
                    other_user_name: user.name,
                    other_user_profile_picture: user.profile_picture,
                    other_user_role: user.role,
                    last_message_content: convData.last_message_content,
                    last_message_sent_at: convData.last_message_sent_at
                };
            });

            // Sort by most recent message
            conversations.sort((a, b) => {
                const timeA = new Date(a.last_message_sent_at).getTime();
                const timeB = new Date(b.last_message_sent_at).getTime();
                return timeB - timeA;
            });

            return { success: true, data: conversations };
        } catch (error) {
            logger.error('Exception in getUserConversations:', error);
            return { success: false, error: error.message };
        }
    }

    static async getUserGroupChats(userId) {
        try {
            // Fetch groups the user is a member of
            const { data: groupMembers, error: groupError } = await db
                .from('group_members')
                .select('group_id')
                .eq('user_id', userId);

            if (groupError) {
                logger.error('Error fetching group memberships:', groupError);
                return { success: false, error: groupError.message };
            }

            if (!groupMembers || groupMembers.length === 0) {
                return { success: true, data: [] };
            }

            const groupIds = groupMembers.map(gm => gm.group_id);

            // Fetch group details
            const { data: groups, error: groupsError } = await db
                .from('chat_groups')
                .select('*')
                .in('id', groupIds);

            if (groupsError) {
                logger.error('Error fetching group details:', groupsError);
                return { success: false, error: groupsError.message };
            }

            // Fetch last message for each group
            const groupsWithLastMessage = await Promise.all(
                groups.map(async (group) => {
                    // Get last message
                    const { data: messages, error: msgError } = await db
                        .from('messages')
                        .select('message, sent_at, sender_id')
                        .eq('group_id', group.id)
                        .eq('is_group', true)
                        .order('sent_at', { ascending: false })
                        .limit(1);

                    const lastMessage = messages && messages.length > 0 ? messages[0] : null;

                    // Get unread count
                    const { count: unreadCount } = await db
                        .from('messages')
                        .select('*', { count: 'exact', head: true })
                        .eq('group_id', group.id)
                        .eq('is_group', true)
                        .neq('sender_id', userId)
                        .eq('is_read', false);

                    return {
                        id: group.id,
                        name: group.name,
                        avatar: group.avatar,
                        description: group.description,
                        created_by: group.created_by,
                        created_at: group.created_at,
                        last_message_content: lastMessage?.message || 'No messages yet',
                        last_message_sent_at: lastMessage?.sent_at || group.created_at,
                        unread_count: unreadCount || 0
                    };
                })
            );

            // Sort by most recent message
            groupsWithLastMessage.sort((a, b) => {
                const timeA = new Date(a.last_message_sent_at).getTime();
                const timeB = new Date(b.last_message_sent_at).getTime();
                return timeB - timeA;
            });

            return { success: true, data: groupsWithLastMessage };
        } catch (error) {
            logger.error('Exception in getUserGroupChats:', error);
            return { success: false, error: error.message };
        }
    }

    static async markAsRead(messageIds, userId) {
        try {
            const { data, error } = await db
                .from(TABLE_NAME)
                .update({ is_read: true })
                .in('id', messageIds)
                .eq('receiver_id', userId)
                .select();

            if (error) {
                logger.error('Error marking messages as read in DB:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (error) {
            logger.error('Exception in markAsRead:', error);
            return { success: false, error: error.message };
        }
    }

    static async getById(messageId) {
        try {
            const { data, error } = await db
                .from(TABLE_NAME)
                .select('*')
                .eq('id', messageId)
                .single();

            if (error) {
                logger.error('Error fetching message by ID from DB:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data };
        } catch (error) {
            logger.error('Exception in getById message:', error);
            return { success: false, error: error.message };
        }
    }

    static async delete(messageId, userId) {
        try {
            const { data, error } = await db
                .from(TABLE_NAME)
                .delete()
                .eq('id', messageId)
                .eq('sender_id', userId)
                .select('*')
                .single();

            if (error) {
                logger.error('Error deleting message from DB:', error);
                return { success: false, error: error.message };
            }

            if (!data) return { success: false, error: 'Message not found or unauthorized' };

            return { success: true, data: { message: 'Message deleted' } };
        } catch (error) {
            logger.error('Exception in delete message:', error);
            return { success: false, error: error.message };
        }
    }

    // Alias for backward compatibility
    static async getDirectMessageThread(userId1, userId2, options) {
        return this.getDirectThread(userId1, userId2, options);
    }
}

module.exports = Message;