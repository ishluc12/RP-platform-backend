
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
                .select('*', { count: 'exact' })
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
                data: data.reverse(),
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
                .select('*', { count: 'exact' })
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
                data: data.reverse(),
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
            const { data, error } = await db
                .from('group_members')
                .select('group_id, chat_groups(*)')
                .eq('user_id', userId);

            if (error) {
                logger.error('Error fetching user group chats from DB:', error);
                return { success: false, error: error.message };
            }

            return { success: true, data: data.map(gm => gm.chat_groups) };
        } catch (error) {
            logger.error('Exception in getUserGroupChats:', error);
            return { success: false, error: error.message };
        }
    }

    static async markAsRead(messageIds, userId) {
        try {
            const { data, error } = await db
                .from(TABLE_NAME)
                .update({ is_read: true, read_at: new Date().toISOString() })
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
}

module.exports = Message;