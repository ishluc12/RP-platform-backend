const express = require('express');
const router = express.Router();

const userRoutes = require('./users');
const postRoutes = require('./posts');
const messageRoutes = require('./messages');
const messageFileRoutes = require('./messageFile');
const notificationRoutes = require('./notifications');
const forumRoutes = require('./forums');
const chatGroupRoutes = require('./chatGroups');
const availabilityRoutes = require('./availability');
const surveyRoutes = require('./surveys');
const surveyFileUploadRoutes = require('./surveyFileUpload');
const eventRoutes = require('./events');
const lecturerAvailabilityRoutes = require('./lecturerAvailability');

// Mount shared routes
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/messages', messageRoutes);
router.use('/messages/file', messageFileRoutes);
router.use('/notifications', notificationRoutes);
router.use('/forums', forumRoutes);
router.use('/chat-groups', chatGroupRoutes);
router.use('/availability', availabilityRoutes);
router.use('/surveys', surveyRoutes);
router.use('/surveys', surveyFileUploadRoutes);
router.use('/events', eventRoutes);
router.use('/lecturer-availability', lecturerAvailabilityRoutes);

module.exports = router;
