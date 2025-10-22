require('dotenv').config();
const { generateToken } = require('./src/config/auth');
const fetch = require('node-fetch');

// Test with REAL administrator user from database
const realAdminPayload = {
    id: '9b0fcd95-7dd7-4571-98c3-866ef0e1a68f', // Real admin ID from database
    email: 'admin.smith@example.com',
    role: 'administrator',
    name: 'Admin Smith'
};

const token = generateToken(realAdminPayload);
console.log('Generated administrator token for real user:', token);

// Test availability creation
async function testAvailabilityCreation() {
    const baseUrl = 'http://localhost:5000/api/administrator';
    
    const headers = {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    };

    // Test payload similar to what frontend sends
    const testPayload = {
        specific_date: '2025-10-16', // Tomorrow
        start_time: '09:00:00',
        end_time: '10:00:00',
        availability_type: 'regular',
        slot_duration_minutes: 30,
        max_appointments_per_slot: 3,
        buffer_time_minutes: 5,
        is_active: true
    };

    try {
        console.log('\n=== Testing Availability Creation ===');
        console.log('Payload:', JSON.stringify(testPayload, null, 2));

        const response = await fetch(`${baseUrl}/availability`, {
            method: 'POST',
            headers,
            body: JSON.stringify(testPayload)
        });

        const result = await response.json();
        
        console.log('\n=== Response ===');
        console.log('Status:', response.status);
        console.log('Response:', JSON.stringify(result, null, 2));

        if (!response.ok) {
            console.log('\n=== ERROR DETAILS ===');
            console.log('Status Text:', response.statusText);
            console.log('Error Message:', result.error || result.message);
        } else {
            console.log('\n✅ SUCCESS! Availability slot created.');
            
            // Test fetching the slots back
            console.log('\n=== Testing Fetch Availability ===');
            const fetchResponse = await fetch(`${baseUrl}/availability`, { headers });
            const fetchResult = await fetchResponse.json();
            
            console.log('Fetch Status:', fetchResponse.status);
            console.log('Fetched Data:', JSON.stringify(fetchResult, null, 2));
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testAvailabilityCreation();