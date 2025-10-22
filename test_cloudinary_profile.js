// Test Cloudinary profile picture upload
require('dotenv').config();
const fs = require('fs');

// Test Cloudinary configuration
const cloudinary = require('./src/config/cloudinary').cloudinary;

console.log('Cloudinary configuration test:');
console.log('- CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? 'Set' : 'Not set');
console.log('- Cloud name:', cloudinary.config().cloud_name);
console.log('- API key:', cloudinary.config().api_key ? 'Set' : 'Not set');

// Create a simple test image (1x1 pixel GIF)
const testImageBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

const testCloudinaryUpload = async () => {
  try {
    console.log('\nTesting Cloudinary profile picture upload...');
    
    // Test with our test image buffer using upload_stream
    return new Promise((resolve) => {
      const stream = cloudinary.uploader.upload_stream({
        resource_type: 'image',
        folder: 'p-community/profile-pictures',
        public_id: 'test_profile_' + Date.now(),
        overwrite: true
      }, (error, result) => {
        if (error) {
          console.log('❌ Cloudinary profile picture upload failed:', error.message);
          resolve({ success: false, error: error.message });
        } else {
          console.log('✅ Cloudinary profile picture upload working correctly');
          console.log('- URL:', result.secure_url);
          console.log('- Public ID:', result.public_id);
          resolve({ success: true, url: result.secure_url });
        }
      });
      
      // Pipe the file buffer to Cloudinary upload stream
      stream.end(testImageBuffer);
    });
  } catch (error) {
    console.error('Error testing Cloudinary profile picture upload:', error.message);
    return { success: false, error: error.message };
  }
};

testCloudinaryUpload().then(result => {
  console.log('Test completed with result:', result);
});