const { generateToken } = require('./src/config/auth');
const fetch = require('node-fetch');

// Generate test admin token
const testAdminPayload = {
    id: 'test-admin-123',
    email: 'admin@test.com',
    role: 'admin',
    name: 'Test Admin'
};

const token = generateToken(testAdminPayload);
console.log('Generated test admin token:', token);

// Test endpoints
async function testEndpoints() {
    const baseUrl = 'http://localhost:5000/api/admin';
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    try {
        // Test dashboard summary endpoint
        console.log('\n=== Testing Dashboard Summary ===');
        const dashboardResponse = await fetch(`${baseUrl}/dashboard/summary`, { headers });
        const dashboardData = await dashboardResponse.json();
        console.log('Status:', dashboardResponse.status);
        console.log('Response:', JSON.stringify(dashboardData, null, 2));

        // Test safe dashboard summary endpoint
        console.log('\n=== Testing Safe Dashboard Summary ===');
        const safeDashboardResponse = await fetch(`${baseUrl}/dashboard/summary-safe`, { headers });
        const safeDashboardData = await safeDashboardResponse.json();
        console.log('Status:', safeDashboardResponse.status);
        console.log('Response:', JSON.stringify(safeDashboardData, null, 2));

        // Test appointments endpoint
        console.log('\n=== Testing Appointments ===');
        const appointmentsResponse = await fetch(`${baseUrl}/appointments`, { headers });
        const appointmentsData = await appointmentsResponse.json();
        console.log('Status:', appointmentsResponse.status);
        console.log('Response:', JSON.stringify(appointmentsData, null, 2));

        // Test safe appointments endpoint
        console.log('\n=== Testing Safe Appointments ===');
        const safeAppointmentsResponse = await fetch(`${baseUrl}/appointments/safe`, { headers });
        const safeAppointmentsData = await safeAppointmentsResponse.json();
        console.log('Status:', safeAppointmentsResponse.status);
        console.log('Response:', JSON.stringify(safeAppointmentsData, null, 2));

    } catch (error) {
        console.error('Error testing endpoints:', error);
    }
}

testEndpoints();