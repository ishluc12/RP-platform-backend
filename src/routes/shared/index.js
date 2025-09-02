const express = require('express');
const router = express.Router();

const userRoutes = require('./users');
const postRoutes = require('./posts');
const messageRoutes = require('./messages');
const notificationRoutes = require('./notifications');
const forumRoutes = require('./forums');
const chatGroupRoutes = require('./chatGroups');
const availabilityRoutes = require('./availability');
const surveyRoutes = require('./surveys');
const eventRoutes = require('./events');

// Mount shared routes
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/forums', forumRoutes);
router.use('/chat-groups', chatGroupRoutes);
router.use('/availability', availabilityRoutes);
router.use('/surveys', surveyRoutes);
router.use('/events', eventRoutes);

module.exports = router;
