// Test the actual profile picture upload API endpoint
require('dotenv').config();
const fs = require('fs');
const FormData = require('form-data');
const fetch = require('node-fetch');

// First, we need to register/login a user to get an auth token
async function registerTestUser() {
    const userData = {
        name: 'Test User',
        email: 'testuser@example.com',
        password: 'testpass123',
        role: 'student'
    };

    try {
        const response = await fetch('http://localhost:5000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData)
        });
        
        const result = await response.json();
        console.log('Registration response:', response.status, result.success);
        
        if (result.success) {
            return result.data.token;
        }
        
        // If registration fails, try to login instead
        const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: userData.email, password: userData.password })
        });
        
        const loginResult = await loginResponse.json();
        console.log('Login response:', loginResponse.status, loginResult.success);
        
        if (loginResult.success) {
            return loginResult.data.token;
        }
        
        throw new Error('Could not register or login user');
    } catch (error) {
        console.error('Auth error:', error.message);
        throw error;
    }
}

async function testProfilePictureUpload() {
    console.log('=== Testing Profile Picture Upload API ===\n');
    
    try {
        // Step 1: Get auth token
        console.log('Step 1: Getting auth token...');
        const token = await registerTestUser();
        console.log('✅ Got auth token');
        
        // Step 2: Create test image
        console.log('\nStep 2: Creating test image...');
        const testImageBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        console.log('✅ Created test image buffer');
        
        // Step 3: Upload profile picture
        console.log('\nStep 3: Uploading profile picture...');
        const formData = new FormData();
        formData.append('profile_picture', testImageBuffer, {
            filename: 'test-profile.gif',
            contentType: 'image/gif'
        });
        
        const uploadResponse = await fetch('http://localhost:5000/api/auth/profile/picture', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                ...formData.getHeaders()
            },
            body: formData
        });
        
        const uploadResult = await uploadResponse.json();
        console.log('Upload response status:', uploadResponse.status);
        console.log('Upload response body:', JSON.stringify(uploadResult, null, 2));
        
        if (uploadResponse.ok && uploadResult.success) {
            console.log('\n✅ Profile picture upload successful!');
            console.log('📸 Image URL:', uploadResult.data.profile_picture);
            
            // Step 4: Verify the profile was updated
            console.log('\nStep 4: Verifying profile update...');
            const profileResponse = await fetch('http://localhost:5000/api/auth/profile', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const profileResult = await profileResponse.json();
            if (profileResult.success && profileResult.data.profile_picture) {
                console.log('✅ Profile updated with new picture');
                console.log('📸 Profile picture URL:', profileResult.data.profile_picture);
            } else {
                console.log('❌ Profile not updated properly');
            }
            
        } else {
            console.log('\n❌ Profile picture upload failed');
            console.log('Error details:', uploadResult);
        }
        
    } catch (error) {
        console.error('\n❌ Test failed with error:', error.message);
        console.error('Stack:', error.stack);
    }
}

// Run the test
testProfilePictureUpload();