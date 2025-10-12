// Test profile picture upload with detailed logging
require('dotenv').config();
const fs = require('fs');
const path = require('path');

// Test Cloudinary configuration
const cloudinary = require('./src/config/cloudinary').cloudinary;
const { uploadImage } = require('./src/config/cloudinary');

console.log('=== Cloudinary Configuration Test ===');
console.log('CLOUDINARY_URL:', process.env.CLOUDINARY_URL ? 'SET' : 'NOT SET');
console.log('Cloud name:', cloudinary.config().cloud_name || 'NOT SET');
console.log('API key:', cloudinary.config().api_key ? 'SET' : 'NOT SET');
console.log('API secret:', cloudinary.config().api_secret ? 'SET' : 'NOT SET');

// Test 1: Direct upload with uploadImage function
console.log('\n=== Test 1: Direct upload with uploadImage function ===');
const testImageBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');

const testUploadImageFunction = async () => {
  try {
    console.log('Uploading with uploadImage function...');
    const result = await uploadImage(testImageBuffer, {
      folder: 'p-community/profile-pictures',
      public_id: 'test_profile_' + Date.now(),
      resource_type: 'image'
    });
    
    console.log('Result:', JSON.stringify(result, null, 2));
    return result;
  } catch (error) {
    console.error('Error with uploadImage function:', error.message);
    return { success: false, error: error.message };
  }
};

// Test 2: Upload stream method (like in AuthController)
console.log('\n=== Test 2: Upload stream method ===');
const testUploadStreamMethod = async () => {
  try {
    console.log('Uploading with upload_stream method...');
    return new Promise((resolve) => {
      const stream = cloudinary.uploader.upload_stream({
        resource_type: 'image',
        folder: 'p-community/profile-pictures',
        public_id: 'test_profile_stream_' + Date.now(),
        overwrite: true
      }, (error, result) => {
        if (error) {
          console.error('Stream upload error:', error.message);
          resolve({ success: false, error: error.message });
        } else {
          console.log('Stream upload result:', JSON.stringify(result, null, 2));
          resolve({ success: true, url: result.secure_url });
        }
      });
      
      // Pipe the file buffer to Cloudinary upload stream
      stream.end(testImageBuffer);
    });
  } catch (error) {
    console.error('Error with upload_stream method:', error.message);
    return { success: false, error: error.message };
  }
};

// Run tests
(async () => {
  console.log('\n=== Running Tests ===');
  
  const result1 = await testUploadImageFunction();
  console.log('\nTest 1 completed:', result1.success ? 'SUCCESS' : 'FAILED');
  
  const result2 = await testUploadStreamMethod();
  console.log('\nTest 2 completed:', result2.success ? 'SUCCESS' : 'FAILED');
  
  console.log('\n=== Test Summary ===');
  console.log('uploadImage function:', result1.success ? '✅ WORKING' : '❌ FAILED');
  console.log('upload_stream method:', result2.success ? '✅ WORKING' : '❌ FAILED');
})();