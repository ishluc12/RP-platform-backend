const { response } = require('../../utils/responseHandlers');

// Function to parse Cloudinary URL
const parseCloudinaryUrl = (url) => {
    if (!url) return null;
    
    // cloudinary://api_key:api_secret@cloud_name
    const match = url.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
    if (!match) return null;
    
    return {
        cloud_name: match[3],
        api_key: match[1],
        api_secret: match[2]
    };
};

/**
 * Get Cloudinary configuration for frontend
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const getCloudinaryConfig = async (req, res) => {
    try {
        let cloudName = process.env.CLOUDINARY_CLOUD_NAME;
        let uploadPreset = process.env.CLOUDINARY_UPLOAD_PRESET;
        
        // If individual variables are not set, try to parse CLOUDINARY_URL
        if (!cloudName || !uploadPreset) {
            const cloudinaryUrl = process.env.CLOUDINARY_URL;
            if (cloudinaryUrl) {
                const parsed = parseCloudinaryUrl(cloudinaryUrl);
                if (parsed) {
                    cloudName = parsed.cloud_name;
                    // uploadPreset still needs to be set separately
                }
            }
        }
        
        // Only send non-sensitive config to frontend
        response(res, 200, 'Cloudinary configuration retrieved', {
            cloudName,
            uploadPreset,
            configured: !!(cloudName && uploadPreset)
        });
    } catch (error) {
        response(res, 200, 'Cloudinary not configured', {
            cloudName: null,
            uploadPreset: null,
            configured: false
        });
    }
};

module.exports = {
    getCloudinaryConfig
};