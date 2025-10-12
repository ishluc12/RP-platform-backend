const router = require('express').Router();
const multer = require('multer');
const { authenticateToken } = require('../../middleware/auth');
const { uploadImage } = require('../../config/cloudinary');
const { v4: uuidv4 } = require('uuid');

// Configure multer storage (in memory)
const storage = multer.memoryStorage();

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max file size
    fileFilter: (req, file, cb) => {
        const allowedTypes = [
            'image/jpeg',
            'image/jpg',
            'image/png',
            'image/gif',
            'image/webp',
            'application/pdf',
            'application/msword',
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
            'application/vnd.ms-excel',
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // .xlsx
            'text/plain',
            'text/csv'
        ];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error(`Unsupported file type: ${file.mimetype}`));
        }
    }
});

// Protected routes (authentication required)
router.use(authenticateToken);

/**
 * Upload a file for survey response
 * POST /api/shared/surveys/upload-file
 */
router.post('/upload-file', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ 
                success: false,
                message: 'No file uploaded' 
            });
        }

        // Convert buffer to base64 data URI for Cloudinary
        const b64 = Buffer.from(req.file.buffer).toString('base64');
        const dataURI = `data:${req.file.mimetype};base64,${b64}`;

        // Upload to Cloudinary
        const uploadOptions = {
            resource_type: 'auto',
            folder: 'survey_uploads',
            public_id: `survey_${uuidv4()}`,
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv']
        };

        const result = await uploadImage(dataURI, uploadOptions);

        if (!result.success) {
            return res.status(500).json({ 
                success: false,
                message: 'File upload failed',
                error: result.error 
            });
        }

        // Return file metadata
        return res.status(200).json({
            success: true,
            message: 'File uploaded successfully',
            data: {
                url: result.url,
                name: req.file.originalname,
                type: req.file.mimetype,
                size: req.file.size,
                public_id: result.public_id
            }
        });

    } catch (error) {
        console.error('Error uploading survey file:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error', 
            error: error.message 
        });
    }
});

/**
 * Upload multiple files for survey response
 * POST /api/shared/surveys/upload-files
 */
router.post('/upload-files', upload.array('files', 5), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ 
                success: false,
                message: 'No files uploaded' 
            });
        }

        const uploadedFiles = [];
        const errors = [];

        // Upload each file
        for (const file of req.files) {
            try {
                const b64 = Buffer.from(file.buffer).toString('base64');
                const dataURI = `data:${file.mimetype};base64,${b64}`;

                const uploadOptions = {
                    resource_type: 'auto',
                    folder: 'survey_uploads',
                    public_id: `survey_${uuidv4()}`,
                    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp', 'pdf', 'doc', 'docx', 'xls', 'xlsx', 'txt', 'csv']
                };

                const result = await uploadImage(dataURI, uploadOptions);

                if (result.success) {
                    uploadedFiles.push({
                        url: result.url,
                        name: file.originalname,
                        type: file.mimetype,
                        size: file.size,
                        public_id: result.public_id
                    });
                } else {
                    errors.push({
                        filename: file.originalname,
                        error: result.error
                    });
                }
            } catch (error) {
                errors.push({
                    filename: file.originalname,
                    error: error.message
                });
            }
        }

        return res.status(200).json({
            success: true,
            message: `${uploadedFiles.length} file(s) uploaded successfully`,
            data: {
                files: uploadedFiles,
                errors: errors.length > 0 ? errors : undefined
            }
        });

    } catch (error) {
        console.error('Error uploading survey files:', error);
        res.status(500).json({ 
            success: false,
            message: 'Internal server error', 
            error: error.message 
        });
    }
});

module.exports = router;
