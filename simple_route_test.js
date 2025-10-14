/**
 * Simple Route Test
 * Test if the staff routes are accessible via HTTP
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

async function testStaffRoutes() {
    console.log('🧪 Testing Staff Routes Accessibility...\n');

    const routes = [
        '/api/staff/appointments',
        '/api/staff/appointments/pending',
        '/api/staff/appointments/availability',
        '/api/staff/appointments/exceptions'
    ];

    for (const route of routes) {
        try {
            console.log(`Testing: ${route}`);
            const response = await axios.get(`${BASE_URL}${route}`, {
                timeout: 5000,
                validateStatus: function (status) {
                    // Accept any status code (including 401, 404, etc.)
                    return true;
                }
            });

            if (response.status === 404) {
                console.log(`❌ ${route} - 404 Not Found`);
            } else if (response.status === 401) {
                console.log(`✅ ${route} - 401 Unauthorized (Route exists, needs auth)`);
            } else if (response.status === 200) {
                console.log(`✅ ${route} - 200 OK`);
            } else {
                console.log(`⚠️  ${route} - ${response.status} ${response.statusText}`);
            }
        } catch (error) {
            if (error.code === 'ECONNREFUSED') {
                console.log(`❌ ${route} - Connection refused (Server not running)`);
            } else if (error.code === 'ENOTFOUND') {
                console.log(`❌ ${route} - Server not found`);
            } else {
                console.log(`❌ ${route} - Error: ${error.message}`);
            }
        }
        console.log('');
    }

    // Test if server is running at all
    try {
        console.log('Testing server health...');
        const healthResponse = await axios.get(`${BASE_URL}/`, { timeout: 5000 });
        console.log(`✅ Server is running - ${healthResponse.status}`);
    } catch (error) {
        console.log(`❌ Server is not running or not accessible: ${error.message}`);
        console.log('💡 Make sure to start the backend server with: npm start or node server.js');
    }
}

// Run the test
if (require.main === module) {
    testStaffRoutes().catch(console.error);
}

module.exports = testStaffRoutes;
