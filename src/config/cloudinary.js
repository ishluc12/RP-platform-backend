const cloudinary = require('cloudinary').v2;

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

// Load Cloudinary credentials from environment variables
let config = {};
if (process.env.CLOUDINARY_URL) {
    // Parse CLOUDINARY_URL
    const parsed = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
    if (parsed) {
        config = {
            cloud_name: parsed.cloud_name,
            api_key: parsed.api_key,
            api_secret: parsed.api_secret,
            secure: true
        };
    }
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    // Fallback to individual variables
    config = {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    };
}

if (!config.cloud_name || !config.api_key || !config.api_secret) {
    throw new Error('Missing Cloudinary environment variables');
}

// Configure Cloudinary
cloudinary.config(config);

/**
 * Upload an image to Cloudinary
 * @param {string|Buffer} file - File path, URL, or Buffer
 * @param {object} options - Optional Cloudinary upload options
 * @returns {object} - { success, url, public_id, format, size, error }
 */
const uploadImage = async (file, options = {}) => {
    try {
        const uploadOptions = {
            resource_type: 'auto',
            folder: 'p-community',
            ...options
        };

        const result = await cloudinary.uploader.upload(file, uploadOptions);
        return {
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            format: result.format,
            size: result.bytes
        };
    } catch (error) {
        console.error('Cloudinary upload error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Delete an image from Cloudinary by public ID
 * @param {string} publicId
 * @returns {object} - { success, result, error }
 */
const deleteImage = async (publicId) => {
    try {
        const result = await cloudinary.uploader.destroy(publicId);
        return { success: true, result };
    } catch (error) {
        console.error('Cloudinary delete error:', error);
        return { success: false, error: error.message };
    }
};

/**
 * Generate an optimized Cloudinary URL
 * @param {string} publicId
 * @param {object} options - Optional transformation options
 * @returns {string} - Optimized URL
 */
const getOptimizedUrl = (publicId, options = {}) => {
    return cloudinary.url(publicId, {
        secure: true,
        ...options
    });
};

module.exports = {
    cloudinary,
    uploadImage,
    deleteImage,
    getOptimizedUrl
};