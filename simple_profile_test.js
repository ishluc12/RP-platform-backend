// Simple test using native Node.js HTTP
const http = require('http');
const fs = require('fs');

// Test user login first
function loginUser() {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({
            email: 'testuser@example.com',
            password: 'testpass123'
        });

        const options = {
            hostname: 'localhost',
            port: 5000,
            path: '/api/auth/login',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                try {
                    const result = JSON.parse(data);
                    console.log('Login response:', res.statusCode, result.success);
                    if (result.success) {
                        resolve(result.data.token);
                    } else {
                        reject(new Error('Login failed: ' + result.message));
                    }
                } catch (error) {
                    reject(error);
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Test profile picture upload using curl (easier for multipart)
async function testWithCurl() {
    console.log('=== Testing Profile Picture Upload ===\n');

    try {
        // Step 1: Try to login
        console.log('Step 1: Logging in...');
        let token;
        try {
            token = await loginUser();
            console.log('✅ Login successful');
        } catch (error) {
            console.log('❌ Login failed:', error.message);
            console.log('Trying to register first...');
            
            // Register user
            await new Promise((resolve, reject) => {
                const userData = JSON.stringify({
                    name: 'Test User',
                    email: 'testuser@example.com',
                    password: 'testpass123',
                    role: 'student'
                });

                const options = {
                    hostname: 'localhost',
                    port: 5000,
                    path: '/api/auth/register',
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Content-Length': Buffer.byteLength(userData)
                    }
                };

                const req = http.request(options, (res) => {
                    let data = '';
                    res.on('data', (chunk) => data += chunk);
                    res.on('end', () => {
                        try {
                            const result = JSON.parse(data);
                            console.log('Registration response:', res.statusCode, result.success);
                            if (result.success) {
                                token = result.data.token;
                            }
                            resolve();
                        } catch (err) {
                            reject(err);
                        }
                    });
                });

                req.on('error', reject);
                req.write(userData);
                req.end();
            });

            if (!token) {
                token = await loginUser();
            }
        }

        // Step 2: Create temporary image file
        console.log('\nStep 2: Creating temporary image file...');
        const testImageBuffer = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
        const tempFile = './temp_profile_test.gif';
        fs.writeFileSync(tempFile, testImageBuffer);
        console.log('✅ Created temporary image file');

        // Step 3: Use curl to upload (PowerShell version)
        console.log('\nStep 3: Uploading profile picture...');
        const { exec } = require('child_process');
        
        const curlCommand = `curl -X POST "http://localhost:5000/api/auth/profile/picture" -H "Authorization: Bearer ${token}" -F "profile_picture=@${tempFile}"`;
        
        await new Promise((resolve, reject) => {
            exec(curlCommand, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                    return;
                }
                
                console.log('Upload response:', stdout);
                
                try {
                    const result = JSON.parse(stdout);
                    if (result.success) {
                        console.log('✅ Profile picture upload successful!');
                        console.log('📸 Image URL:', result.data.profile_picture);
                    } else {
                        console.log('❌ Upload failed:', result.message);
                    }
                } catch (parseError) {
                    console.log('Response (raw):', stdout);
                }
                
                resolve();
            });
        });

        // Clean up
        if (fs.existsSync(tempFile)) {
            fs.unlinkSync(tempFile);
            console.log('🧹 Cleaned up temporary file');
        }

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testWithCurl();