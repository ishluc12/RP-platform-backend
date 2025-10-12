const Message = require('../../models/Message');
const ChatGroup = require('../../models/ChatGroup');
const NotificationModel = require('../../models/Notification');
const User = require('../../models/User');
const { response, errorResponse } = require('../../utils/responseHandlers');
const { logger } = require('../../utils/logger');
const { getFileInfo } = require('../../services/uploadService');

/**
 * Send a message (direct or group)
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const sendMessage = async (req, res) => {
    try {
        const senderId = req.user.id;
        const { content, receiverId, groupId } = req.body;

        if (!content || content.trim() === '') {
            return errorResponse(res, 400, 'Message content cannot be empty');
        }

        // Validate that either receiverId or groupId is provided, not both
        if ((!receiverId && !groupId) || (receiverId && groupId)) {
            return errorResponse(res, 400, 'Provide either receiverId for direct message or groupId for group message');
        }

        const messageData = {
            sender_id: senderId,
            message: content.trim(),
            is_group: !!groupId,
            group_id: groupId || null,
            receiver_id: receiverId || null,
            message_type: 'text',
            sent_at: new Date().toISOString()
        };

        const result = await Message.create(messageData);
        if (!result.success) {
            logger.error('Failed to send message:', result.error);
            return errorResponse(res, 400, result.error);
        }

        const newMessage = result.data;

        // Create notification for the recipient(s)
        if (newMessage.receiver_id) {
            // Direct message
            const senderUser = await User.findById(senderId);
            const senderName = senderUser.success ? senderUser.data.name : 'Someone';

            await NotificationModel.createNotification({
                user_id: newMessage.receiver_id,
                type: 'message_new_direct',
                content: `New message from ${senderName}: ${newMessage.message.substring(0, 50)}...`,
                source_id: newMessage.id,
                source_table: 'messages',
            });
        } else if (newMessage.group_id) {
            // Group message
            const groupMembersResult = await ChatGroup.getMembers(newMessage.group_id);
            if (groupMembersResult.success && groupMembersResult.data.length > 0) {
                const senderUser = await User.findById(senderId);
                const senderName = senderUser.success ? senderUser.data.name : 'Someone';
                const chatGroup = await ChatGroup.getById(newMessage.group_id);
                const groupName = chatGroup.success ? chatGroup.data.name : 'a group';

                for (const member of groupMembersResult.data) {
                    if (member.id !== senderId) { // Don't notify the sender
                        await NotificationModel.createNotification({
                            user_id: member.id,
                            type: 'message_new_group',
                            content: `New message in ${groupName} from ${senderName}: ${newMessage.message.substring(0, 50)}...`,
                            source_id: newMessage.id,
                            source_table: 'messages',
                        });
                    }
                }
            }
        }

        response(res, 201, 'Message sent successfully', result.data);
    } catch (error) {
        logger.error('Error sending message:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

/**
 * Send a file message (direct or group)
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const sendFile = async (req, res) => {
    try {
        const senderId = req.user.id;
        
        // Check if file was uploaded
        if (!req.file) {
            return errorResponse(res, 400, 'No file uploaded');
        }

        const { receiverId, groupId, message: content } = req.body;

        // Validate that either receiverId or groupId is provided, not both
        if ((!receiverId && !groupId) || (receiverId && groupId)) {
            return errorResponse(res, 400, 'Provide either receiverId for direct message or groupId for group message');
        }

        // Get file information
        const fileInfo = getFileInfo(req.file);

        const messageData = {
            sender_id: senderId,
            message: content || '', // Optional text message with file
            is_group: !!groupId,
            group_id: groupId || null,
            receiver_id: receiverId || null,
            message_type: 'file',
            file_name: fileInfo.originalName,
            file_type: fileInfo.mimetype,
            file_size: fileInfo.size,
            file_url: fileInfo.url,
            sent_at: new Date().toISOString()
        };

        const result = await Message.create(messageData);
        if (!result.success) {
            logger.error('Failed to send file message:', result.error);
            return errorResponse(res, 400, result.error);
        }

        const newMessage = result.data;

        // Create notification for the recipient(s)
        if (newMessage.receiver_id) {
            // Direct message
            const senderUser = await User.findById(senderId);
            const senderName = senderUser.success ? senderUser.data.name : 'Someone';

            await NotificationModel.createNotification({
                user_id: newMessage.receiver_id,
                type: 'message_new_direct',
                content: `New file from ${senderName}`,
                source_id: newMessage.id,
                source_table: 'messages',
            });
        } else if (newMessage.group_id) {
            // Group message
            const groupMembersResult = await ChatGroup.getMembers(newMessage.group_id);
            if (groupMembersResult.success && groupMembersResult.data.length > 0) {
                const senderUser = await User.findById(senderId);
                const senderName = senderUser.success ? senderUser.data.name : 'Someone';
                const chatGroup = await ChatGroup.getById(newMessage.group_id);
                const groupName = chatGroup.success ? chatGroup.data.name : 'a group';

                for (const member of groupMembersResult.data) {
                    if (member.id !== senderId) { // Don't notify the sender
                        await NotificationModel.createNotification({
                            user_id: member.id,
                            type: 'message_new_group',
                            content: `New file in ${groupName} from ${senderName}`,
                            source_id: newMessage.id,
                            source_table: 'messages',
                        });
                    }
                }
            }
        }

        response(res, 201, 'File message sent successfully', result.data);
    } catch (error) {
        logger.error('Error sending file message:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

/**
 * Get messages for a specific group chat.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getGroupMessages = async (req, res) => {
    try {
        const { groupId } = req.params;
        const { page = 1, limit = 50 } = req.query;
        const userId = req.user.id;

        if (!groupId) {
            return errorResponse(res, 400, 'Group ID is required');
        }

        // Check if user is member of the group (simple check)
        const { data: memberCheck } = await require('../../config/database').supabase
            .from('group_members')
            .select('user_id')
            .eq('group_id', groupId)
            .eq('user_id', userId)
            .single();

        if (!memberCheck) {
            return errorResponse(res, 403, 'You are not a member of this group');
        }

        const result = await Message.getGroupMessages(groupId, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        if (!result.success) {
            logger.error('Failed to fetch group messages:', result.error);
            return errorResponse(res, 400, result.error);
        }

        response(res, 200, 'Group messages fetched successfully', {
            messages: result.data || [],
            pagination: result.pagination || {}
        });
    } catch (error) {
        logger.error('Error fetching group messages:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

/**
 * Get direct message thread with another user
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getDirectMessageThread = async (req, res) => {
    try {
        const { otherId: otherUserId } = req.params;
        const currentUserId = req.user.id;
        const { page = 1, limit = 50 } = req.query;

        if (!otherUserId) {
            return errorResponse(res, 400, 'Other user ID is required');
        }

        if (otherUserId === currentUserId) {
            return errorResponse(res, 400, 'Cannot get thread with yourself');
        }

        const result = await Message.getDirectThread(currentUserId, otherUserId, {
            page: parseInt(page),
            limit: parseInt(limit)
        });

        if (!result.success) {
            logger.error('Failed to fetch direct message thread:', result.error);
            return errorResponse(res, 400, result.error);
        }

        response(res, 200, 'Direct message thread fetched successfully', {
            messages: result.data || [],
            pagination: result.pagination || {}
        });
    } catch (error) {
        logger.error('Error fetching direct message thread:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

/**
 * Get a list of all direct message conversations for the authenticated user.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getUserConversations = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await Message.getUserConversations(userId);

        if (!result.success) {
            logger.error('Failed to fetch user conversations:', result.error);
            // Return empty array instead of error for better UX
            return response(res, 200, 'No conversations found', []);
        }

        response(res, 200, 'User conversations fetched successfully', result.data || []);
    } catch (error) {
        logger.error('Error fetching user conversations:', error.message);
        // Return empty array instead of error for better UX
        response(res, 200, 'No conversations found', []);
    }
};

/**
 * Get a list of all group chats the authenticated user is a member of.
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const getUserGroupChats = async (req, res) => {
    try {
        const userId = req.user.id;

        const result = await Message.getUserGroupChats(userId);

        if (!result.success) {
            logger.error('Failed to fetch user group chats:', result.error);
            // Return empty array instead of error for better UX
            return response(res, 200, 'No group chats found', []);
        }

        response(res, 200, 'User group chats fetched successfully', result.data || []);
    } catch (error) {
        logger.error('Error fetching user group chats:', error.message);
        // Return empty array instead of error for better UX
        response(res, 200, 'No group chats found', []);
    }
};

/**
 * Mark messages as read
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const markAsRead = async (req, res) => {
    try {
        const userId = req.user.id;
        const { messageIds } = req.body;

        if (!Array.isArray(messageIds) || messageIds.length === 0) {
            return errorResponse(res, 400, 'Message IDs array is required');
        }

        const result = await Message.markAsRead(messageIds, userId);

        if (!result.success) {
            logger.error('Failed to mark messages as read:', result.error);
            return errorResponse(res, 400, result.error);
        }

        response(res, 200, 'Messages marked as read', result.data);
    } catch (error) {
        logger.error('Error marking messages as read:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

/**
 * Download a file from a message
 * @param {Object} req - Express request object.
 * @param {Object} res - Express response object.
 */
const downloadFile = async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        // Validate messageId
        if (!messageId) {
            return errorResponse(res, 400, 'Message ID is required');
        }

        // Fetch message details from the database
        const messageResult = await Message.getById(messageId);

        if (!messageResult.success || !messageResult.data) {
            return errorResponse(res, 404, 'Message not found');
        }

        const message = messageResult.data;

        // Security check: Ensure the user is part of the conversation
        let isUserInConversation = false;
        
        if (message.sender_id === userId || message.receiver_id === userId) {
            isUserInConversation = true;
        } else if (message.is_group && message.group_id) {
            isUserInConversation = await Message.isUserInGroup(userId, message.group_id);
        }

        if (!isUserInConversation) {
            return errorResponse(res, 403, 'You do not have access to this file');
        }

        // Check if it's a file message
        if (message.message_type !== 'file' || !message.file_url) {
            return errorResponse(res, 400, 'This message does not contain a downloadable file');
        }

        // Validate file exists and is not empty
        if (!message.file_name || message.file_name.trim() === '') {
            return errorResponse(res, 400, 'File name is missing or invalid');
        }

        // Check file size to prevent downloading empty files
        if (message.file_size !== null && message.file_size <= 0) {
            return errorResponse(res, 400, 'Cannot download empty file');
        }

        // If it's a Cloudinary URL, redirect directly
        if (message.file_url.includes('cloudinary.com')) {
            // Validate Cloudinary URL is accessible
            try {
                const https = require('https');
                const http = require('http');
                const client = message.file_url.startsWith('https') ? https : http;
                
                // Make a HEAD request to check if file exists
                const checkRequest = client.request(message.file_url, { method: 'HEAD' }, (checkRes) => {
                    if (checkRes.statusCode >= 200 && checkRes.statusCode < 300) {
                        // File exists, redirect to it
                        return res.redirect(message.file_url);
                    } else {
                        logger.error(`Cloudinary file not found: ${message.file_url}, status: ${checkRes.statusCode}`);
                        return errorResponse(res, 404, 'File not found on storage');
                    }
                });
                
                checkRequest.on('error', (error) => {
                    logger.error('Error checking Cloudinary file:', error);
                    return errorResponse(res, 500, 'Error accessing file');
                });
                
                checkRequest.setTimeout(5000, () => {
                    checkRequest.destroy();
                    return errorResponse(res, 504, 'File access timeout');
                });
                
                checkRequest.end();
            } catch (error) {
                logger.error('Error validating Cloudinary URL:', error);
                return errorResponse(res, 500, 'Error validating file');
            }
        } else {
            // For local files, serve them directly
            const fs = require('fs');
            const path = require('path');
            
            // Construct the full file path
            const fullPath = path.join(__dirname, '../../../', message.file_url);
            
            // Check if file exists and get stats
            if (!fs.existsSync(fullPath)) {
                logger.error('File not found on disk:', fullPath);
                return errorResponse(res, 404, 'File not found on server');
            }

            // Get file stats to check size
            const stats = fs.statSync(fullPath);
            if (stats.size <= 0) {
                logger.error('Empty file detected:', fullPath);
                return errorResponse(res, 400, 'Cannot download empty file');
            }

            // Set appropriate headers for file download
            res.setHeader('Content-Disposition', `attachment; filename="${message.file_name}"`);
            res.setHeader('Content-Type', message.file_type || 'application/octet-stream');
            res.setHeader('Content-Length', stats.size);
            
            // Stream the file
            const fileStream = fs.createReadStream(fullPath);
            fileStream.pipe(res);
            
            fileStream.on('error', (error) => {
                logger.error('Error streaming file:', error);
                if (!res.headersSent) {
                    errorResponse(res, 500, 'Error streaming file');
                }
            });
        }
        
    } catch (error) {
        logger.error('Error downloading file:', error.message);
        errorResponse(res, 500, 'Internal server error', error.message);
    }
};

module.exports = {
    sendMessage,
    sendFile,
    getGroupMessages,
    getDirectMessageThread,
    getUserConversations,
    getUserGroupChats,
    markAsRead,
    downloadFile
};
