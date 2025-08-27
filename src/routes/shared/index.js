const express = require('express');
const router = express.Router();

const userRoutes = require('./users');
const postRoutes = require('./posts');
const messageRoutes = require('./messages');
const notificationRoutes = require('./notifications');
const forumRoutes = require('./forums');
const availabilityRoutes = require('./availability');
const surveyRoutes = require('./surveys');

// Mount shared routes
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/forums', forumRoutes);
router.use('/availability', availabilityRoutes);
router.use('/surveys', surveyRoutes);

module.exports = router;
