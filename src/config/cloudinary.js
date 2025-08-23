const cloudinary = require('cloudinary').v2;

// Load Cloudinary credentials from environment variables
const cloudinaryConfig = {
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
};

if (!cloudinaryConfig.cloud_name || !cloudinaryConfig.api_key || !cloudinaryConfig.api_secret) {
    throw new Error('Missing Cloudinary environment variables');
}

// Configure Cloudinary
cloudinary.config(cloudinaryConfig);

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
            allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
            transformation: [
                { quality: 'auto:good' },
                { fetch_format: 'auto' }
            ],
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
    const defaultOptions = {
        quality: 'auto:good',
        fetch_format: 'auto',
        ...options
    };
    return cloudinary.url(publicId, defaultOptions);
};

module.exports = {
    cloudinary,
    uploadImage,
    deleteImage,
    getOptimizedUrl
};
