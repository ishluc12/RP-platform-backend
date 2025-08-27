const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../../middleware/auth');
const { requireStudentOrAdmin } = require('../../middleware/roleAuth');
const {
    studentCreateSurvey,
    studentListSurveys,
    studentGetSurvey,
    studentUpdateSurvey,
    studentDeleteSurvey,
    uploadSurveyAttachment
} = require('../../controllers/shared/surveyController');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

router.use(authenticateToken);
router.use(requireStudentOrAdmin());

// POST /api/shared/surveys
router.post('/', studentCreateSurvey);

// GET /api/shared/surveys
router.get('/', studentListSurveys);

// GET /api/shared/surveys/:id
router.get('/:id', studentGetSurvey);

// PUT /api/shared/surveys/:id
router.put('/:id', studentUpdateSurvey);

// DELETE /api/shared/surveys/:id
router.delete('/:id', studentDeleteSurvey);

// File storage config for survey attachments (local disk)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = path.join('uploads', 'surveys');
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, 'survey-' + uniqueSuffix + path.extname(file.originalname));
    }
});
const fileFilter = (req, file, cb) => {
    // Accept PDFs, images, and text/CSV
    const allowed = ['application/pdf', 'image/', 'text/plain', 'text/csv', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
    if (file.mimetype === 'application/pdf' || file.mimetype.startsWith('image/') || allowed.includes(file.mimetype)) {
        return cb(null, true);
    }
    return cb(new Error('Unsupported file type'), false);
};
const upload = multer({ storage, fileFilter, limits: { fileSize: 10 * 1024 * 1024 } });

// POST /api/shared/surveys/:id/attachments - sys_admin only
router.post('/:id/attachments', upload.single('file'), uploadSurveyAttachment);

module.exports = router;


