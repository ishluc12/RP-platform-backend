const axios = require('axios');

const BASE_URL = 'http://localhost:5000';

// Test data for availability creation
const testAvailabilityData = {
    staff_id: 'test-staff-id',
    day_of_week: 1, // Monday
    start_time: '09:00',
    end_time: '17:00',
    break_start_time: '12:00',
    break_end_time: '13:00',
    slot_duration_minutes: 30,
    max_appointments_per_slot: 1,
    buffer_time_minutes: 5,
    availability_type: 'regular',
    valid_from: '2024-01-01',
    valid_to: '2024-12-31'
};

// Test data for survey template creation
const testSurveyData = {
    title: 'Test Survey',
    description: 'This is a test survey',
    questions: [
        {
            question_text: 'How satisfied are you?',
            question_type: 'multiple_choice',
            is_required: true,
            options: [
                { option_text: 'Very Satisfied', option_value: '5' },
                { option_text: 'Satisfied', option_value: '4' },
                { option_text: 'Neutral', option_value: '3' },
                { option_text: 'Dissatisfied', option_value: '2' },
                { option_text: 'Very Dissatisfied', option_value: '1' }
            ]
        }
    ]
};

async function testStaffAvailability() {
    console.log('🧪 Testing Staff Availability System...');

    try {
        // Test availability endpoint (should require auth)
        const response = await axios.get(`${BASE_URL}/api/staff/appointments/availability`);
        console.log('❌ Availability endpoint should require authentication');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Availability endpoint properly requires authentication');
        } else {
            console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
    }

    try {
        // Test availability creation endpoint
        const response = await axios.post(`${BASE_URL}/api/staff/appointments/availability`, testAvailabilityData);
        console.log('❌ Availability creation should require authentication');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Availability creation properly requires authentication');
        } else if (error.response?.status === 400 && error.response.data?.message?.includes('availability_type')) {
            console.log('❌ DATABASE SCHEMA ISSUE: availability_type column missing');
            console.log('   Please run the fix_database_schema.sql script');
        } else {
            console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
    }
}

async function testSurveySystem() {
    console.log('\n🧪 Testing Survey System...');

    try {
        // Test survey templates endpoint (should require auth)
        const response = await axios.get(`${BASE_URL}/api/shared/surveys/templates`);
        console.log('❌ Survey templates endpoint should require authentication');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Survey templates endpoint properly requires authentication');
        } else {
            console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
    }

    try {
        // Test survey template creation endpoint
        const response = await axios.post(`${BASE_URL}/api/shared/surveys/templates`, testSurveyData);
        console.log('❌ Survey template creation should require authentication');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Survey template creation properly requires authentication');
        } else {
            console.log('❌ Unexpected error:', error.response?.data || error.message);
        }
    }
}

async function testServerHealth() {
    console.log('🧪 Testing Server Health...');

    try {
        const response = await axios.get(`${BASE_URL}/`);
        if (response.data.message === 'API is running!') {
            console.log('✅ Server is running and healthy');
        } else {
            console.log('❌ Server response unexpected:', response.data);
        }
    } catch (error) {
        console.log('❌ Server is not running or not accessible:', error.message);
    }
}

async function runAllTests() {
    console.log('🚀 Starting Comprehensive System Test...\n');

    await testServerHealth();
    await testStaffAvailability();
    await testSurveySystem();

    console.log('\n📋 Test Summary:');
    console.log('1. Server Health: Check if server is running');
    console.log('2. Staff Availability: Check if routes are mounted and require auth');
    console.log('3. Survey System: Check if routes are mounted and require auth');
    console.log('\n🔧 Next Steps:');
    console.log('1. Apply database migration: fix_database_schema.sql');
    console.log('2. Test with valid JWT tokens');
    console.log('3. Verify frontend integration works');
}

// Run the tests
runAllTests().catch(console.error);
