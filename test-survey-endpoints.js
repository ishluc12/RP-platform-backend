/**
 * Survey API Endpoints Test Script
 * Run this to verify all survey endpoints are accessible
 * 
 * Usage: node test-survey-endpoints.js
 */

const http = require('http');

const BASE_URL = 'localhost';
const PORT = 5000;

// Test endpoints
const endpoints = [
    { method: 'GET', path: '/health', auth: false, description: 'Health check' },
    { method: 'POST', path: '/api/auth/login', auth: false, description: 'Login endpoint' },
    { method: 'GET', path: '/api/shared/surveys', auth: true, description: 'List surveys (shared)' },
    { method: 'GET', path: '/api/admin/surveys', auth: true, description: 'List surveys (admin)' },
];

let testResults = [];

function makeRequest(method, path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE_URL,
            port: PORT,
            path: path,
            method: method,
            headers: {
                'Content-Type': 'application/json'
            }
        };

        const req = http.request(options, (res) => {
            let data = '';
            res.on('data', (chunk) => data += chunk);
            res.on('end', () => {
                resolve({
                    statusCode: res.statusCode,
                    headers: res.headers,
                    body: data
                });
            });
        });

        req.on('error', (error) => {
            reject(error);
        });

        req.setTimeout(5000, () => {
            req.destroy();
            reject(new Error('Request timeout'));
        });

        req.end();
    });
}

async function testEndpoint(endpoint) {
    try {
        const result = await makeRequest(endpoint.method, endpoint.path);
        
        // For auth-required endpoints, 401 is expected without token
        const isSuccess = endpoint.auth 
            ? result.statusCode === 401 || result.statusCode === 200
            : result.statusCode === 200 || result.statusCode === 404;

        return {
            endpoint: `${endpoint.method} ${endpoint.path}`,
            description: endpoint.description,
            status: result.statusCode,
            success: isSuccess,
            message: isSuccess ? '✅ Accessible' : '❌ Unexpected response'
        };
    } catch (error) {
        return {
            endpoint: `${endpoint.method} ${endpoint.path}`,
            description: endpoint.description,
            status: 'ERROR',
            success: false,
            message: `❌ ${error.message}`
        };
    }
}

async function runTests() {
    console.log('🔍 Testing Survey API Endpoints...\n');
    console.log(`Server: http://${BASE_URL}:${PORT}\n`);
    console.log('═'.repeat(80));

    for (const endpoint of endpoints) {
        const result = await testEndpoint(endpoint);
        testResults.push(result);
        
        console.log(`\n${result.message}`);
        console.log(`Endpoint: ${result.endpoint}`);
        console.log(`Description: ${result.description}`);
        console.log(`Status Code: ${result.status}`);
        console.log('─'.repeat(80));
    }

    // Summary
    const successCount = testResults.filter(r => r.success).length;
    const totalCount = testResults.length;
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n📊 TEST SUMMARY\n');
    console.log(`Total Endpoints Tested: ${totalCount}`);
    console.log(`Accessible: ${successCount}`);
    console.log(`Failed: ${totalCount - successCount}`);
    console.log(`Success Rate: ${((successCount / totalCount) * 100).toFixed(1)}%`);
    
    if (successCount === totalCount) {
        console.log('\n✅ All endpoints are accessible! Server is ready for Postman testing.');
    } else {
        console.log('\n⚠️  Some endpoints are not accessible. Check server logs.');
    }
    
    console.log('\n' + '═'.repeat(80));
    console.log('\n📝 NEXT STEPS:\n');
    console.log('1. Import the Postman collection: postman/Survey_API_Tests.postman_collection.json');
    console.log('2. Read the guide: postman/SURVEY_API_TESTING_GUIDE.md');
    console.log('3. Start testing with the "0. Authentication" folder');
    console.log('\n' + '═'.repeat(80));
}

// Check if server is running first
console.log('Checking if server is running...\n');

makeRequest('GET', '/health')
    .then(() => {
        console.log('✅ Server is running!\n');
        return runTests();
    })
    .catch((error) => {
        console.error('❌ Server is not running or not accessible!');
        console.error(`Error: ${error.message}\n`);
        console.log('Please start the server first:');
        console.log('  cd "e:\\Final year project\\RP-platform-backend"');
        console.log('  npm start\n');
        process.exit(1);
    });
