// Test Cloudinary file upload functionality
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Create a test file
const testContent = 'This is a test file for Cloudinary upload testing.';
fs.writeFileSync('test.txt', testContent);

console.log('Test file created successfully.');

// Test Cloudinary configuration
const { cloudinary, uploadImage } = require('./src/config/cloudinary');

console.log('Cloudinary configuration test:');
console.log('- CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? 'Set' : 'Not set');
console.log('- Cloud name:', cloudinary.config().cloud_name);
console.log('- API key:', cloudinary.config().api_key ? 'Set' : 'Not set');
console.log('- API secret:', cloudinary.config().api_secret ? 'Set' : 'Not set');

// Test the uploadImage function
const testCloudinaryUpload = async () => {
  try {
    console.log('\nTesting Cloudinary upload function...');
    
    // Test with our test file
    const result = await uploadImage('./test.txt', {
      folder: 'test',
      public_id: 'test_file_' + Date.now()
    });
    
    console.log('Upload result:', result);
    
    if (result.success) {
      console.log('✅ Cloudinary upload working correctly');
      console.log('- URL:', result.url);
      console.log('- Public ID:', result.public_id);
    } else {
      console.log('❌ Cloudinary upload failed:', result.error);
    }
  } catch (error) {
    console.error('Error testing Cloudinary upload:', error.message);
  } finally {
    // Clean up test file
    if (fs.existsSync('test.txt')) {
      fs.unlinkSync('test.txt');
    }
  }
};

testCloudinaryUpload();