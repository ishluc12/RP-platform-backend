/**
 * Test script to verify staff routes are working
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:5000/api';

async function testStaffRoutes() {
    console.log('🧪 Testing Staff Routes...\n');

    const testToken = 'test-token'; // You'll need a real JWT token for this to work

    const headers = {
        'Authorization': `Bearer ${testToken}`,
        'Content-Type': 'application/json'
    };

    try {
        // Test 1: Check if staff routes are mounted
        console.log('1. Testing route mounting...');

        // Test availability route
        try {
            const response = await axios.get(`${BASE_URL}/staff/appointments/availability`, { headers });
            console.log('✅ Staff availability route is accessible');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Staff availability route is mounted (401 Unauthorized - expected without valid token)');
            } else if (error.response?.status === 404) {
                console.log('❌ Staff availability route not found (404)');
            } else {
                console.log(`⚠️  Staff availability route error: ${error.response?.status}`);
            }
        }

        // Test exceptions route
        try {
            const response = await axios.get(`${BASE_URL}/staff/appointments/exceptions`, { headers });
            console.log('✅ Staff exceptions route is accessible');
        } catch (error) {
            if (error.response?.status === 401) {
                console.log('✅ Staff exceptions route is mounted (401 Unauthorized - expected without valid token)');
            } else if (error.response?.status === 404) {
                console.log('❌ Staff exceptions route not found (404)');
            } else {
                console.log(`⚠️  Staff exceptions route error: ${error.response?.status}`);
            }
        }

        // Test 2: Check route structure
        console.log('\n2. Testing route structure...');

        const routes = [
            '/staff/appointments',
            '/staff/appointments/availability',
            '/staff/appointments/exceptions',
            '/staff/appointments/pending',
            '/staff/appointments/upcoming'
        ];

        for (const route of routes) {
            try {
                await axios.get(`${BASE_URL}${route}`, { headers });
                console.log(`✅ ${route} - accessible`);
            } catch (error) {
                if (error.response?.status === 401) {
                    console.log(`✅ ${route} - mounted (401 Unauthorized)`);
                } else if (error.response?.status === 404) {
                    console.log(`❌ ${route} - not found (404)`);
                } else {
                    console.log(`⚠️  ${route} - error ${error.response?.status}`);
                }
            }
        }

        console.log('\n🎉 Staff routes test completed!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

// Run the test
if (require.main === module) {
    testStaffRoutes().catch(console.error);
}

module.exports = testStaffRoutes;
