const { emitToUser, emitToRole, emitToAll } = require('../config/socket');

// Setup Socket.io handlers
const setupSocketHandlers = (io) => {
    // Store connected users
    const connectedUsers = new Map();

    io.on('connection', (socket) => {
        const userId = socket.userId;
        const userRole = socket.userRole;

        // Add user to connected users map
        connectedUsers.set(userId, {
            socketId: socket.id,
            role: userRole,
            connectedAt: new Date().toISOString(),
            lastActivity: new Date().toISOString()
        });

        console.log(`🔌 User ${userId} (${userRole}) connected`);

        // Handle user status updates
        socket.on('update_status', (data) => {
            const { status } = data;
            const validStatuses = ['online', 'offline', 'away', 'busy'];

            if (validStatuses.includes(status)) {
                // Update user status in connected users map
                if (connectedUsers.has(userId)) {
                    connectedUsers.get(userId).status = status;
                    connectedUsers.get(userId).lastActivity = new Date().toISOString();
                }

                // Emit status change to all connected users
                emitToAll(io, 'user_status_changed', {
                    userId,
                    status,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Handle typing indicators in messages
        socket.on('typing_start', (data) => {
            const { recipientId, conversationId } = data;

            // Emit typing indicator to recipient
            emitToUser(io, recipientId, 'typing_start', {
                userId,
                conversationId,
                timestamp: new Date().toISOString()
            });
        });

        socket.on('typing_stop', (data) => {
            const { recipientId, conversationId } = data;

            // Emit typing stop to recipient
            emitToUser(io, recipientId, 'typing_stop', {
                userId,
                conversationId,
                timestamp: new Date().toISOString()
            });
        });

        // Handle user activity
        socket.on('user_activity', (data) => {
            const { activityType, details } = data;

            // Update last activity
            if (connectedUsers.has(userId)) {
                connectedUsers.get(userId).lastActivity = new Date().toISOString();
            }

            // Emit activity to role-specific users (e.g., admins)
            if (activityType === 'login' || activityType === 'logout') {
                emitToRole(io, 'admin', 'user_activity_log', {
                    userId,
                    activityType,
                    details,
                    timestamp: new Date().toISOString()
                });
            }
        });

        // Handle notifications
        socket.on('notification_read', (data) => {
            const { notificationId } = data;

            // Emit notification read status to admins
            emitToRole(io, 'admin', 'notification_status_changed', {
                userId,
                notificationId,
                status: 'read',
                timestamp: new Date().toISOString()
            });
        });

        // Handle real-time collaboration
        socket.on('document_edit', (data) => {
            const { documentId, changes, collaborators } = data;

            // Emit changes to all collaborators
            collaborators.forEach(collaboratorId => {
                if (collaboratorId !== userId) {
                    emitToUser(io, collaboratorId, 'document_changed', {
                        documentId,
                        changes,
                        userId,
                        timestamp: new Date().toISOString()
                    });
                }
            });
        });

        // Handle presence updates
        socket.on('presence_update', (data) => {
            const { status, customStatus } = data;

            // Update user presence
            if (connectedUsers.has(userId)) {
                const user = connectedUsers.get(userId);
                user.status = status;
                user.customStatus = customStatus;
                user.lastActivity = new Date().toISOString();
            }

            // Emit presence update to all users
            emitToAll(io, 'presence_updated', {
                userId,
                status,
                customStatus,
                timestamp: new Date().toISOString()
            });
        });

        // Handle user search in real-time
        socket.on('search_users', (data) => {
            const { query, filters } = data;

            // In a real application, you'd perform the search here
            // For now, we'll just acknowledge the search request
            socket.emit('search_initiated', {
                query,
                filters,
                timestamp: new Date().toISOString()
            });
        });

        // Handle user blocking/unblocking
        socket.on('block_user', (data) => {
            const { targetUserId, reason } = data;

            // Emit block event to admins
            emitToRole(io, 'admin', 'user_blocked', {
                userId,
                targetUserId,
                reason,
                timestamp: new Date().toISOString()
            });
        });

        // Handle user reporting
        socket.on('report_user', (data) => {
            const { targetUserId, reason, evidence } = data;

            // Emit report to admins
            emitToRole(io, 'admin', 'user_reported', {
                userId,
                targetUserId,
                reason,
                evidence,
                timestamp: new Date().toISOString()
            });
        });

        // Handle emergency notifications
        socket.on('emergency_alert', (data) => {
            const { message, priority, location } = data;

            // Emit emergency alert to all users
            emitToAll(io, 'emergency_alert', {
                message,
                priority,
                location,
                userId,
                timestamp: new Date().toISOString()
            });
        });

        // Handle user feedback
        socket.on('submit_feedback', (data) => {
            const { type, message, rating } = data;

            // Emit feedback to admins
            emitToRole(io, 'admin', 'feedback_submitted', {
                userId,
                type,
                message,
                rating,
                timestamp: new Date().toISOString()
            });
        });

        // Handle user preferences sync
        socket.on('sync_preferences', (data) => {
            const { preferences } = data;

            // Store user preferences (in a real app, you'd save to database)
            if (connectedUsers.has(userId)) {
                connectedUsers.get(userId).preferences = preferences;
            }

            // Acknowledge preferences sync
            socket.emit('preferences_synced', {
                timestamp: new Date().toISOString()
            });
        });

        // Handle user session management
        socket.on('extend_session', () => {
            // Extend user session
            if (connectedUsers.has(userId)) {
                connectedUsers.get(userId).lastActivity = new Date().toISOString();
            }

            socket.emit('session_extended', {
                timestamp: new Date().toISOString()
            });
        });

        // Handle disconnection
        socket.on('disconnect', (reason) => {
            console.log(`🔌 User ${userId} disconnected: ${reason}`);

            // Remove user from connected users map
            connectedUsers.delete(userId);

            // Emit user offline status
            emitToAll(io, 'user_offline', {
                userId,
                timestamp: new Date().toISOString()
            });

            // Log disconnection for admins
            emitToRole(io, 'admin', 'user_disconnected', {
                userId,
                reason,
                timestamp: new Date().toISOString()
            });
        });

        // Handle errors
        socket.on('error', (error) => {
            console.error('Socket error for user', userId, ':', error);

            // Emit error to admins
            emitToRole(io, 'admin', 'socket_error', {
                userId,
                error: error.message,
                timestamp: new Date().toISOString()
            });
        });
    });

    // Return connected users info for admin purposes
    return {
        getConnectedUsers: () => {
            const users = [];
            connectedUsers.forEach((userData, userId) => {
                users.push({
                    userId,
                    ...userData
                });
            });
            return users;
        },

        getConnectedUsersCount: () => connectedUsers.size,

        getUserConnectionInfo: (userId) => connectedUsers.get(userId),

        disconnectUser: (userId) => {
            const userData = connectedUsers.get(userId);
            if (userData) {
                const socket = io.sockets.sockets.get(userData.socketId);
                if (socket) {
                    socket.disconnect(true);
                }
                connectedUsers.delete(userId);
                return true;
            }
            return false;
        }
    };
};

// Utility functions for external use
const sendNotification = (io, userId, notification) => {
    emitToUser(io, userId, 'new_notification', notification);
};

const sendMessage = (io, userId, message) => {
    emitToUser(io, userId, 'new_message', message);
};

const broadcastToRole = (io, role, event, data) => {
    emitToRole(io, role, event, data);
};

const broadcastToAll = (io, event, data) => {
    emitToAll(io, event, data);
};

module.exports = {
    setupSocketHandlers,
    sendNotification,
    sendMessage,
    broadcastToRole,
    broadcastToAll
};
