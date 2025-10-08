const fs = require('fs');
const path = require('path');

// Ensure uploads directory exists
const ensureUploadsDirectory = () => {
  const dir = path.join(__dirname, '../../uploads/messages');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
};

// Initialize on module load
ensureUploadsDirectory();

/**
 * Get file information for storage
 * @param {Object} file - Multer file object
 * @returns {Object} File information
 */
const getFileInfo = (file) => {
  return {
    originalName: file.originalname,
    filename: file.filename,
    path: file.path,
    mimetype: file.mimetype,
    size: file.size,
    url: `/uploads/messages/${file.filename}`
  };
};

/**
 * Delete a file from storage
 * @param {string} filePath - Path to the file to delete
 */
const deleteFile = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  } catch (error) {
    console.error('Error deleting file:', error);
  }
};

module.exports = {
  getFileInfo,
  deleteFile,
  ensureUploadsDirectory
};