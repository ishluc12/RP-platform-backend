const router = require('express').Router();
const multer = require('multer');
const path = require('path');
const { authenticateToken } = require('../../middleware/auth');
const MessageController = require('../../controllers/shared/messageController');
const cloudinary = require('../../config/cloudinary');
const { v4: uuidv4 } = require('uuid');

// Configure multer storage (in memory)
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'video/mp4'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Unsupported file type'));
        }
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
        const uploadResult = await cloudinary.uploader.upload_stream({
            resource_type: 'auto',
            folder: 'message_files',
            public_id: uuidv4(),
            overwrite: true
        }, async (error, result) => {
            if (error) {
                return res.status(500).json({ error: 'File upload failed', details: error.message });
            }

            // Create message with file URL as content and message_type as 'file'
            const messageData = {
                sender_id: senderId,
                message: result.secure_url,
                is_group: !!groupId,
                group_id: groupId || null,
                receiver_id: receiverId || null,
                message_type: 'file',
                sent_at: new Date().toISOString()
            };

            const createResult = await Message.create(messageData);
            if (!createResult.success) {
                return res.status(400).json({ error: createResult.error });
            }

            return res.status(201).json({ message: 'File message sent successfully', data: createResult.data });
        });

        // Pipe the file buffer to Cloudinary upload stream
        const stream = uploadResult;
        stream.end(req.file.buffer);

    } catch (error) {
        console.error('Error uploading file message:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
});

module.exports = router;
