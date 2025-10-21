const { emitToUser } = require('../config/socket');

const setupNotificationSocket = (io) => {
    io.on('connection', (socket) => {
        socket.on('joinNotifications', (userId) => {
            if (socket.userId && socket.userId.toString() === userId.toString()) {
                socket.join(`notifications_${userId}`);
                console.log(`✅ User ${userId} joined notifications room`);
            } else {
                console.warn(`⚠️ User ${socket.userId} attempted to join notifications for ${userId}`);
            }
        });

        socket.on('leaveNotifications', (userId) => {
            socket.leave(`notifications_${userId}`);
            console.log(`❌ User ${userId} left notifications room`);
        });
    });
};

const sendNotificationToUser = (io, userId, notification) => {
    io.to(`notifications_${userId}`).emit('newNotification', notification);
    io.to(`user_${userId}`).emit('newNotification', notification);
    console.log(`📬 Notification sent to user ${userId}`);
};

module.exports = {
    setupNotificationSocket,
    sendNotificationToUser
};
