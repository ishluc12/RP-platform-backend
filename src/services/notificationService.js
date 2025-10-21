const NotificationModel = require('../models/Notification');
const { sendNotificationToUser } = require('../sockets/notificationSocket');

class NotificationService {
    constructor(io) {
        this.io = io;
    }

    async createAndSend(userId, type, content, sourceTable = null, sourceId = null, sourceDetails = null) {
        try {
            const result = await NotificationModel.create({
                user_id: userId,
                type,
                content,
                source_table: sourceTable,
                source_id: sourceId,
                source_details: sourceDetails
            });

            if (result.success && this.io) {
                sendNotificationToUser(this.io, userId, result.data);
            }

            return result;
        } catch (error) {
            console.error('Error creating notification:', error);
            return { success: false, error: error.message };
        }
    }

    async sendExisting(userId, notification) {
        if (this.io) {
            sendNotificationToUser(this.io, userId, notification);
        }
    }
}

let notificationServiceInstance = null;

const initializeNotificationService = (io) => {
    notificationServiceInstance = new NotificationService(io);
    console.log('✅ Notification service initialized');
    return notificationServiceInstance;
};

const getNotificationService = () => {
    if (!notificationServiceInstance) {
        console.warn('⚠️ Notification service not initialized, creating without io');
        notificationServiceInstance = new NotificationService(null);
    }
    return notificationServiceInstance;
};

module.exports = {
    initializeNotificationService,
    getNotificationService,
    NotificationService
};
