const express = require('express');
const router = express.Router();

const userRoutes = require('./users');
const postRoutes = require('./posts');
const messageRoutes = require('./messages');
const notificationRoutes = require('./notifications');
const forumRoutes = require('./forums');

// Mount shared routes
router.use('/users', userRoutes);
router.use('/posts', postRoutes);
router.use('/messages', messageRoutes);
router.use('/notifications', notificationRoutes);
router.use('/forums', forumRoutes);

module.exports = router;
