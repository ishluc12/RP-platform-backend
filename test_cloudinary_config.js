require('dotenv').config();
console.log('CLOUDINARY_URL:', process.env.CLOUDINARY_URL);

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
    console.log('Found CLOUDINARY_URL');
    // Parse CLOUDINARY_URL
    const parsed = parseCloudinaryUrl(process.env.CLOUDINARY_URL);
    console.log('Parsed result:', parsed);
    if (parsed) {
        config = {
            cloud_name: parsed.cloud_name,
            api_key: parsed.api_key,
            api_secret: parsed.api_secret,
            secure: true
        };
    }
} else if (process.env.CLOUDINARY_CLOUD_NAME && process.env.CLOUDINARY_API_KEY && process.env.CLOUDINARY_API_SECRET) {
    console.log('Using individual variables');
    // Fallback to individual variables
    config = {
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET,
        secure: true
    };
}

console.log('Config:', config);

if (!config.cloud_name || !config.api_key || !config.api_secret) {
    console.log('Missing config values:');
    console.log('- cloud_name:', config.cloud_name);
    console.log('- api_key:', config.api_key);
    console.log('- api_secret:', config.api_secret);
    throw new Error('Missing Cloudinary environment variables');
}

console.log('All config values present, configuring Cloudinary...');
cloudinary.config(config);
console.log('Cloudinary configured successfully!');