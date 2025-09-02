const { supabase } = require('../config/database');

class ChatGroup {
    /**
     * Create a new chat group
     * @param {Object} params
     * @param {string} params.name
     * @param {number} params.created_by
     * @param {Array<number>} [params.initial_members]
     * @returns {Promise<Object>}
     */
    static async create({ name, created_by, initial_members = [] }) {
        try {
            const { data: group, error: groupError } = await supabase
                .from('chat_groups')
                .insert([{ name, created_by }])
                .select('id')
                .single();

            if (groupError) throw groupError;

            const groupId = group.id;

            // Add the creator to the group members
            const membersToInsert = [{ group_id: groupId, user_id: created_by }];

            // Add initial members if provided, ensuring creator is not duplicated
            initial_members.forEach(memberId => {
                if (memberId !== created_by) {
                    membersToInsert.push({ group_id: groupId, user_id: memberId });
                }
            });

            const { data: members, error: membersError } = await supabase
                .from('group_members')
                .insert(membersToInsert)
                .select('*');

            if (membersError) throw membersError;

            return { success: true, data: { ...group, members } };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Get a chat group by ID with its members and latest messages
     * @param {number} groupId
     * @returns {Promise<Object>}
     */
    static async getById(groupId) {
        try {
            const { data: group, error: groupError } = await supabase
                .from('chat_groups')
                .select(`
                    *,
                    members:group_members(user_id, joined_at, users(id, name, profile_picture)),
                    latest_message:messages(sender_id, message, sent_at, users(id, name, profile_picture))
                `)
                .eq('id', groupId)
                .single();

            if (groupError) throw groupError;
            if (!group) return { success: false, error: 'Chat group not found' };

            const formattedGroup = {
                ...group,
                members: group.members.map(m => ({ ...m.users, joined_at: m.joined_at })),
                latest_message: group.latest_message[0] ? { ...group.latest_message[0].users, message: group.latest_message[0].message, sent_at: group.latest_message[0].sent_at } : null
            };

            return { success: true, data: formattedGroup };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Update a chat group's details
     * @param {number} groupId
     * @param {number} userId - The ID of the user trying to update (for authorization)
     * @param {Object} updates - Fields to update (name, description)
     * @returns {Promise<Object>}
     */
    static async update(groupId, userId, updates) {
        try {
            // Ensure only the creator or an admin can update the group
            const { data: existingGroup, error: fetchError } = await supabase
                .from('chat_groups')
                .select('created_by')
                .eq('id', groupId)
                .single();

            if (fetchError) throw fetchError;
            if (!existingGroup) return { success: false, error: 'Chat group not found' };

            // TODO: Add role check for admin (requires fetching user role in controller)
            if (existingGroup.created_by !== userId) {
                return { success: false, error: 'Unauthorized to update this chat group' };
            }

            const allowedFields = ['name'];
            const filteredUpdates = {};
            allowedFields.forEach(field => {
                if (updates[field] !== undefined) filteredUpdates[field] = updates[field];
            });

            if (Object.keys(filteredUpdates).length === 0) {
                return { success: false, error: 'No valid fields provided for update' };
            }

            const { data, error } = await supabase
                .from('chat_groups')
                .update(filteredUpdates)
                .eq('id', groupId)
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Delete a chat group
     * @param {number} groupId
     * @param {number} userId - The ID of the user trying to delete (for authorization)
     * @returns {Promise<Object>}
     */
    static async delete(groupId, userId) {
        try {
            // Ensure only the creator or an admin can delete the group
            const { data: existingGroup, error: fetchError } = await supabase
                .from('chat_groups')
                .select('created_by')
                .eq('id', groupId)
                .single();

            if (fetchError) throw fetchError;
            if (!existingGroup) return { success: false, error: 'Chat group not found' };

            // TODO: Add role check for admin (requires fetching user role in controller)
            if (existingGroup.created_by !== userId) {
                return { success: false, error: 'Unauthorized to delete this chat group' };
            }

            // Delete related group members first
            const { error: deleteMembersError } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId);
            if (deleteMembersError) throw deleteMembersError;

            // Delete related messages
            const { error: deleteMessagesError } = await supabase
                .from('messages')
                .delete()
                .eq('group_id', groupId);
            if (deleteMessagesError) throw deleteMessagesError;

            const { data, error } = await supabase
                .from('chat_groups')
                .delete()
                .eq('id', groupId)
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data: { message: 'Chat group deleted successfully' } };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Add a member to a chat group
     * @param {number} groupId
     * @param {number} userId - User to add
     * @returns {Promise<Object>}
     */
    static async addMember(groupId, userId) {
        try {
            // Check if user is already a member
            const { data: existingMember, error: checkError } = await supabase
                .from('group_members')
                .select('*')
                .eq('group_id', groupId)
                .eq('user_id', userId)
                .single();

            if (checkError && checkError.code !== 'PGRST116') throw checkError; // PGRST116 means no rows found, which is fine
            if (existingMember) return { success: false, error: 'User is already a member of this group' };

            const { data, error } = await supabase
                .from('group_members')
                .insert([{ group_id: groupId, user_id: userId }])
                .select('*')
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }

    /**
     * Remove a member from a chat group
     * @param {number} groupId
     * @param {number} userId - User to remove
     * @returns {Promise<Object>}
     */
    static async removeMember(groupId, userId) {
        try {
            const { data, error } = await supabase
                .from('group_members')
                .delete()
                .eq('group_id', groupId)
                .eq('user_id', userId)
                .select('*')
                .single();

            if (error) throw error;
            if (!data) return { success: false, error: 'Member not found in this group' };

            return { success: true, data: { message: 'Member removed successfully' } };
        } catch (error) {
            return { success: false, error: error.message || 'Unknown error' };
        }
    }
}

module.exports = ChatGroup;
