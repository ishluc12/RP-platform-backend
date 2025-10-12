const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage for uploaded files
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Ensure directory exists before saving
    const dir = 'uploads/messages/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename with timestamp
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'message-file-' + uniqueSuffix + path.extname(file.originalname));
  }
});

// File filter to validate files
const fileFilter = (req, file, cb) => {
  // Log file type for debugging
  console.log('Uploading file:', {
    originalname: file.originalname,
    mimetype: file.mimetype,
    size: file.size
  });
  
  // Check if file has a name
  if (!file.originalname || file.originalname.trim() === '') {
    console.error('File validation failed: Empty filename');
    return cb(new Error('File must have a valid name'), false);
  }
  
  // Check if filename is not just extension
  const nameWithoutExt = path.parse(file.originalname).name;
  if (!nameWithoutExt || nameWithoutExt.trim() === '') {
    console.error('File validation failed: Invalid filename (extension only)');
    return cb(new Error('File must have a valid name before the extension'), false);
  }
  
  // Allow all file types for maximum compatibility
  cb(null, true);
};

// Custom middleware to check file size after upload
const validateFileSize = (req, res, next) => {
  if (req.file) {
    // Check if file is empty (0 bytes)
    if (req.file.size <= 0) {
      console.error('File validation failed: Empty file detected');
      return res.status(400).json({ error: 'Cannot upload empty files' });
    }
    
    // Check if file is suspiciously small (less than 1 byte for any file type)
    console.log(`File size validation passed: ${req.file.size} bytes`);
  }
  next();
};

// Create upload middleware
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 1 // Only allow 1 file at a time
  }
});

// Export both upload middleware and validation
module.exports = upload;
module.exports.validateFileSize = validateFileSize;
