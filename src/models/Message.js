const { supabase } = require('../config/database');

class Message {
    /**
     * Create a new message
     * @param {Object} messageData
     * @returns {Promise<Object>}
     */
    static async create(messageData) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .insert([messageData])
                .select('*')
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Send a message (alias for create)
     * @param {Object} params
     * @returns {Promise<Object>}
     */
    static async send(params) {
        const messageData = {
            sender_id: params.sender_id,
            receiver_id: params.receiver_id || null,
            message: params.message,
            is_group: params.is_group || false,
            group_id: params.group_id || null,
            message_type: params.message_type || 'text',
            sent_at: new Date().toISOString()
        };

        return await this.create(messageData);
    }

    /**
     * Get direct message thread between two users
     * @param {string} currentUserId
     * @param {string} otherUserId
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    static async getDirectThread(currentUserId, otherUserId, { page = 1, limit = 50 } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error } = await supabase
                .from('messages')
                .select(`
                    id,
                    sender_id,
                    receiver_id,
                    message,
                    sent_at,
                    is_read,
                    message_type,
                    sender:sender_id(id, name, profile_picture),
                    receiver:receiver_id(id, name, profile_picture)
                `)
                .or(`and(sender_id.eq.${currentUserId},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${currentUserId})`)
                .eq('is_group', false)
                .order('sent_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            // Format the messages for frontend consumption
            const formattedMessages = (data || []).map(msg => ({
                id: msg.id,
                sender_id: msg.sender_id,
                receiver_id: msg.receiver_id,
                content: msg.message,
                message: msg.message, // Alias for compatibility
                timestamp: msg.sent_at,
                sent_at: msg.sent_at, // Alias for compatibility
                is_read: msg.is_read,
                message_type: msg.message_type,
                sender_name: msg.sender?.name || 'Unknown',
                senderName: msg.sender?.name || 'Unknown', // Alias for compatibility
                sender_profile_picture: msg.sender?.profile_picture
            }));

            return {
                success: true,
                data: formattedMessages.reverse(), // Reverse to show oldest first
                pagination: {
                    page,
                    limit,
                    total: formattedMessages.length
                }
            };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get messages for a specific group chat
     * @param {string} groupId
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    static async getGroupMessages(groupId, { page = 1, limit = 50 } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error } = await supabase
                .from('messages')
                .select(`
                    id,
                    sender_id,
                    group_id,
                    message,
                    sent_at,
                    is_read,
                    message_type,
                    sender:sender_id(id, name, profile_picture)
                `)
                .eq('group_id', groupId)
                .eq('is_group', true)
                .order('sent_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            // Format the messages for frontend consumption
            const formattedMessages = (data || []).map(msg => ({
                id: msg.id,
                sender_id: msg.sender_id,
                group_id: msg.group_id,
                content: msg.message,
                message: msg.message, // Alias for compatibility
                timestamp: msg.sent_at,
                sent_at: msg.sent_at, // Alias for compatibility
                is_read: msg.is_read,
                message_type: msg.message_type,
                sender_name: msg.sender?.name || 'Unknown',
                senderName: msg.sender?.name || 'Unknown', // Alias for compatibility
                sender_profile_picture: msg.sender?.profile_picture
            }));

            return {
                success: true,
                data: formattedMessages.reverse(), // Reverse to show oldest first
                pagination: {
                    page,
                    limit,
                    total: formattedMessages.length
                }
            };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get user's direct message conversations
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    static async getUserConversations(userId) {
        try {
            // Get the most recent message for each conversation
            const { data, error } = await supabase
                .from('messages')
                .select(`
                    id,
                    sender_id,
                    receiver_id,
                    message,
                    sent_at,
                    sender:sender_id(id, name, profile_picture),
                    receiver:receiver_id(id, name, profile_picture)
                `)
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .eq('is_group', false)
                .order('sent_at', { ascending: false });

            if (error) throw error;

            // Group conversations by other user
            const conversationsMap = new Map();

            (data || []).forEach(msg => {
                const otherUserId = msg.sender_id === userId ? msg.receiver_id : msg.sender_id;
                const otherUser = msg.sender_id === userId ? msg.receiver : msg.sender;

                if (!conversationsMap.has(otherUserId)) {
                    conversationsMap.set(otherUserId, {
                        other_user_id: otherUserId,
                        other_user_name: otherUser?.name || 'Unknown User',
                        other_user_profile_picture: otherUser?.profile_picture,
                        last_message_content: msg.message,
                        last_message_sent_at: msg.sent_at,
                        last_message_id: msg.id
                    });
                }
            });

            const conversations = Array.from(conversationsMap.values());

            return { success: true, data: conversations };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get user's group chats
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    static async getUserGroupChats(userId) {
        try {
            // First, get all groups the user is a member of
            const { data: memberGroups, error: memberError } = await supabase
                .from('group_members')
                .select(`
                    group_id,
                    joined_at,
                    chat_groups!inner(id, name, created_by, created_at, avatar)
                `)
                .eq('user_id', userId);

            if (memberError) throw memberError;

            if (!memberGroups || memberGroups.length === 0) {
                return { success: true, data: [] };
            }

            // Get the latest message for each group
            const groupIds = memberGroups.map(mg => mg.group_id);

            const { data: latestMessages, error: messageError } = await supabase
                .from('messages')
                .select(`
                    group_id,
                    message,
                    sent_at,
                    sender:sender_id(name, profile_picture)
                `)
                .in('group_id', groupIds)
                .eq('is_group', true)
                .order('sent_at', { ascending: false });

            if (messageError) {
                console.log('Error fetching latest messages, continuing without them:', messageError);
            }

            // Create a map of latest messages by group_id
            const latestMessageMap = new Map();
            if (latestMessages) {
                latestMessages.forEach(msg => {
                    if (!latestMessageMap.has(msg.group_id)) {
                        latestMessageMap.set(msg.group_id, msg);
                    }
                });
            }

            // Format the group data
            const formattedGroups = memberGroups.map(mg => {
                const latestMsg = latestMessageMap.get(mg.group_id);
                return {
                    id: mg.chat_groups.id,
                    name: mg.chat_groups.name,
                    created_by: mg.chat_groups.created_by,
                    created_at: mg.chat_groups.created_at,
                    joined_at: mg.joined_at,
                    latest_message: latestMsg ? {
                        message: latestMsg.message,
                        sent_at: latestMsg.sent_at,
                        sender_name: latestMsg.sender?.name || 'Unknown',
                        sender_profile_picture: latestMsg.sender?.profile_picture
                    } : null,
                    last_message: latestMsg?.message || 'No messages yet', // Alias for compatibility
                    updated_at: latestMsg?.sent_at || mg.chat_groups.created_at
                };
            });

            return { success: true, data: formattedGroups };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Mark messages as read
     * @param {Array<string>} messageIds
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    static async markAsRead(messageIds, userId) {
        try {
            const { data, error } = await supabase
                .from('messages')
                .update({ is_read: true })
                .in('id', messageIds)
                .eq('receiver_id', userId) // Only allow marking own received messages as read
                .select('id');

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Delete a message (soft delete or hard delete)
     * @param {string} messageId
     * @param {string} userId
     * @returns {Promise<Object>}
     */
    static async delete(messageId, userId) {
        try {
            // Only allow deleting own messages
            const { data, error } = await supabase
                .from('messages')
                .delete()
                .eq('id', messageId)
                .eq('sender_id', userId)
                .select('id')
                .single();

            if (error) throw error;

            if (!data) {
                return { success: false, error: 'Message not found or unauthorized' };
            }

            return { success: true, data: { id: messageId } };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Search messages
     * @param {string} userId
     * @param {string} searchQuery
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    static async search(userId, searchQuery, { page = 1, limit = 20 } = {}) {
        try {
            const from = (page - 1) * limit;
            const to = from + limit - 1;

            const { data, error } = await supabase
                .from('messages')
                .select(`
                    id,
                    sender_id,
                    receiver_id,
                    group_id,
                    message,
                    sent_at,
                    is_group,
                    sender:sender_id(name, profile_picture),
                    receiver:receiver_id(name, profile_picture)
                `)
                .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
                .ilike('message', `%${searchQuery}%`)
                .order('sent_at', { ascending: false })
                .range(from, to);

            if (error) throw error;

            return { success: true, data: data || [] };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }
}

module.exports = Message;