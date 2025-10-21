const { generateToken } = require('./src/config/auth');
const fetch = require('node-fetch');

// Generate test administrator token
const testAdministratorPayload = {
    id: 'test-administrator-123',
    email: 'administrator@test.com',
    role: 'administrator',
    name: 'Test Administrator'
};

const token = generateToken(testAdministratorPayload);
console.log('Generated test administrator token:', token);

// Test endpoints
async function testAdministratorEndpoints() {
    const baseUrl = 'http://localhost:5000/api/administrator';
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        console.log('\n=== Testing Administrator Base Endpoint ===');
        const baseResponse = await fetch(`${baseUrl}`, { headers });
        const baseData = await baseResponse.json();
        console.log('Status:', baseResponse.status);
        console.log('Response:', JSON.stringify(baseData, null, 2));

        console.log('\n=== Testing Administrator Availability ===');
        const availabilityResponse = await fetch(`${baseUrl}/availability`, { headers });
        const availabilityData = await availabilityResponse.json();
        console.log('Status:', availabilityResponse.status);
        console.log('Response:', JSON.stringify(availabilityData, null, 2));

        console.log('\n=== Testing Administrator Appointments ===');
        const appointmentsResponse = await fetch(`${baseUrl}/appointments`, { headers });
        const appointmentsData = await appointmentsResponse.json();
        console.log('Status:', appointmentsResponse.status);
        console.log('Response:', JSON.stringify(appointmentsData, null, 2));

        console.log('\n=== Testing Administrator Dashboard ===');
        const dashboardResponse = await fetch(`${baseUrl}/dashboard`, { headers });
        const dashboardData = await dashboardResponse.json();
        console.log('Status:', dashboardResponse.status);
        console.log('Response:', JSON.stringify(dashboardData, null, 2));

    } catch (error) {
        console.error('Error testing administrator endpoints:', error);
    }
}

testAdministratorEndpoints();