const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../../middleware/auth');
const Message = require('../../models/Message');
const cloudinary = require('../../config/cloudinary');
const { v4: uuidv4 } = require('uuid');

// Configure multer storage (in memory)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
    fileFilter: (req, file, cb) => {
        // Allow all file types for Cloudinary processing
        cb(null, true);
    }
});

// Protected routes (authentication required)
router.use(authenticateToken);

// Route to upload a file as a message attachment
router.post('/', upload.single('file'), async (req, res) => {
    try {
        const senderId = req.user.id;
        const { receiverId, groupId } = req.body;

        if ((!receiverId && !groupId) || (receiverId && groupId)) {
            return res.status(400).json({ error: 'Provide either receiverId for direct message or groupId for group message' });
        }

        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        // Upload file buffer to Cloudinary
        const stream = cloudinary.uploader.upload_stream({
            resource_type: 'auto',
            folder: 'message_files',
            public_id: uuidv4(),
            overwrite: true
        }, async (error, result) => {
            if (error) {
                console.error('Cloudinary upload error:', error);
                return res.status(500).json({ error: 'File upload failed', details: error.message });
            }

            // Create message with file metadata and message_type as 'file'
            const messageData = {
                sender_id: senderId,
                message: req.file.originalname, // keep a human-friendly label
                is_group: !!groupId,
                group_id: groupId || null,
                receiver_id: receiverId || null,
                message_type: 'file',
                file_url: result.secure_url,
                file_name: req.file.originalname,
                file_size: req.file.size,
                file_type: req.file.mimetype,
                sent_at: new Date().toISOString()
            };

            try {
                const createResult = await Message.create(messageData);
                if (!createResult.success) {
                    return res.status(400).json({ error: createResult.error });
                }
                return res.status(201).json({ message: 'File message sent successfully', data: createResult.data });
            } catch (e) {
                console.error('Error creating file message record:', e);
                return res.status(500).json({ error: 'Failed to save file message' });
            }
        });

        // Pipe the file buffer to Cloudinary upload stream
        stream.end(req.file.buffer);

    } catch (error) {
        console.error('Error uploading file message:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

// Route to download a file from a message
router.get('/download/:messageId', async (req, res) => {
    try {
        const { messageId } = req.params;
        const userId = req.user.id;

        // Fetch message details from the database
        const messageResult = await Message.getById(messageId);

        if (!messageResult.success || !messageResult.data) {
            return res.status(404).json({ error: 'Message not found' });
        }

        const message = messageResult.data;

        // Security check: Ensure the user is part of the conversation
        const isUserInConversation =
            message.sender_id === userId ||
            message.receiver_id === userId ||
            (message.is_group && (await Message.isUserInGroup(userId, message.group_id)));

        if (!isUserInConversation) {
            return res.status(403).json({ error: 'You do not have access to this file' });
        }

        // Check if it's a file message
        if (message.message_type !== 'file' || !message.file_url) {
            return res.status(400).json({ error: 'This message does not contain a downloadable file' });
        }

        // Redirect to the Cloudinary URL for download
        return res.redirect(message.file_url);

    } catch (error) {
        console.error('Error downloading file:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;