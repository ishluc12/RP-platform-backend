/**
 * Integration Test Script for Appointment and Survey Systems
 * This script tests the authentication integration and API endpoints
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_USER = {
    email: 'test@example.com',
    password: 'TestPassword123!'
};

// Test data
const testAppointment = {
    appointee_id: '550e8400-e29b-41d4-a716-446655440010',
    appointment_date: '2024-02-15',
    start_time: '10:00',
    end_time: '11:00',
    reason: 'Academic consultation',
    appointment_type: 'academic',
    priority: 'normal'
};

const testSurvey = {
    title: 'Integration Test Survey',
    description: 'Test survey for integration verification',
    target_audience: 'students',
    is_active: true,
    is_anonymous: false,
    allow_multiple_submissions: false
};

class IntegrationTester {
    constructor() {
        this.authToken = null;
        this.testResults = [];
    }

    async runTests() {
        console.log('🚀 Starting Integration Tests...\n');

        try {
            // Test 1: Authentication
            await this.testAuthentication();

            // Test 2: Appointment System
            await this.testAppointmentSystem();

            // Test 3: Survey System
            await this.testSurveySystem();

            // Test 4: Unauthorized Access
            await this.testUnauthorizedAccess();

            this.printResults();
        } catch (error) {
            console.error('❌ Test suite failed:', error.message);
        }
    }

    async testAuthentication() {
        console.log('🔐 Testing Authentication...');

        try {
            // Test login
            const loginResponse = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);

            if (loginResponse.data.success && loginResponse.data.data.token) {
                this.authToken = loginResponse.data.data.token;
                this.addResult('Authentication', 'PASS', 'Login successful');
                console.log('✅ Authentication: PASS');
            } else {
                this.addResult('Authentication', 'FAIL', 'Login failed - no token received');
                console.log('❌ Authentication: FAIL');
            }
        } catch (error) {
            this.addResult('Authentication', 'FAIL', `Login error: ${error.response?.data?.message || error.message}`);
            console.log('❌ Authentication: FAIL');
        }
    }

    async testAppointmentSystem() {
        console.log('\n📅 Testing Appointment System...');

        if (!this.authToken) {
            this.addResult('Appointment System', 'SKIP', 'No auth token available');
            return;
        }

        const headers = {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
        };

        try {
            // Test creating appointment
            const createResponse = await axios.post(
                `${BASE_URL}/student/appointments`,
                testAppointment,
                { headers }
            );

            if (createResponse.data.success) {
                this.addResult('Appointment Creation', 'PASS', 'Appointment created successfully');
                console.log('✅ Appointment Creation: PASS');

                // Test getting appointments
                const listResponse = await axios.get(`${BASE_URL}/student/appointments`, { headers });
                if (listResponse.data.success) {
                    this.addResult('Appointment Listing', 'PASS', 'Appointments retrieved successfully');
                    console.log('✅ Appointment Listing: PASS');
                } else {
                    this.addResult('Appointment Listing', 'FAIL', 'Failed to retrieve appointments');
                    console.log('❌ Appointment Listing: FAIL');
                }
            } else {
                this.addResult('Appointment Creation', 'FAIL', 'Failed to create appointment');
                console.log('❌ Appointment Creation: FAIL');
            }
        } catch (error) {
            this.addResult('Appointment System', 'FAIL', `Appointment error: ${error.response?.data?.message || error.message}`);
            console.log('❌ Appointment System: FAIL');
        }
    }

    async testSurveySystem() {
        console.log('\n📊 Testing Survey System...');

        if (!this.authToken) {
            this.addResult('Survey System', 'SKIP', 'No auth token available');
            return;
        }

        const headers = {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
        };

        try {
            // Test creating survey template
            const createResponse = await axios.post(
                `${BASE_URL}/shared/surveys`,
                testSurvey,
                { headers }
            );

            if (createResponse.data.success) {
                this.addResult('Survey Creation', 'PASS', 'Survey template created successfully');
                console.log('✅ Survey Creation: PASS');

                const surveyId = createResponse.data.data.id;

                // Test getting survey details
                const detailsResponse = await axios.get(`${BASE_URL}/shared/surveys/${surveyId}`, { headers });
                if (detailsResponse.data.success) {
                    this.addResult('Survey Details', 'PASS', 'Survey details retrieved successfully');
                    console.log('✅ Survey Details: PASS');
                } else {
                    this.addResult('Survey Details', 'FAIL', 'Failed to retrieve survey details');
                    console.log('❌ Survey Details: FAIL');
                }

                // Test listing surveys
                const listResponse = await axios.get(`${BASE_URL}/shared/surveys`, { headers });
                if (listResponse.data.success) {
                    this.addResult('Survey Listing', 'PASS', 'Surveys listed successfully');
                    console.log('✅ Survey Listing: PASS');
                } else {
                    this.addResult('Survey Listing', 'FAIL', 'Failed to list surveys');
                    console.log('❌ Survey Listing: FAIL');
                }
            } else {
                this.addResult('Survey Creation', 'FAIL', 'Failed to create survey');
                console.log('❌ Survey Creation: FAIL');
            }
        } catch (error) {
            this.addResult('Survey System', 'FAIL', `Survey error: ${error.response?.data?.message || error.message}`);
            console.log('❌ Survey System: FAIL');
        }
    }

    async testUnauthorizedAccess() {
        console.log('\n🚫 Testing Unauthorized Access...');

        try {
            // Test accessing protected routes without token
            await axios.get(`${BASE_URL}/student/appointments`);
            this.addResult('Unauthorized Access', 'FAIL', 'Should have been blocked without token');
            console.log('❌ Unauthorized Access: FAIL - Should have been blocked');
        } catch (error) {
            if (error.response?.status === 401) {
                this.addResult('Unauthorized Access', 'PASS', 'Correctly blocked unauthorized access');
                console.log('✅ Unauthorized Access: PASS - Correctly blocked');
            } else {
                this.addResult('Unauthorized Access', 'FAIL', `Unexpected error: ${error.message}`);
                console.log('❌ Unauthorized Access: FAIL - Unexpected error');
            }
        }
    }

    addResult(test, status, message) {
        this.testResults.push({ test, status, message });
    }

    printResults() {
        console.log('\n📋 Test Results Summary:');
        console.log('========================');

        const passed = this.testResults.filter(r => r.status === 'PASS').length;
        const failed = this.testResults.filter(r => r.status === 'FAIL').length;
        const skipped = this.testResults.filter(r => r.status === 'SKIP').length;

        console.log(`✅ Passed: ${passed}`);
        console.log(`❌ Failed: ${failed}`);
        console.log(`⏭️  Skipped: ${skipped}`);

        console.log('\nDetailed Results:');
        this.testResults.forEach(result => {
            const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⏭️';
            console.log(`${icon} ${result.test}: ${result.status} - ${result.message}`);
        });

        if (failed === 0) {
            console.log('\n🎉 All tests passed! Integration is working correctly.');
        } else {
            console.log('\n⚠️  Some tests failed. Please check the integration.');
        }
    }
}

// Run the tests
if (require.main === module) {
    const tester = new IntegrationTester();
    tester.runTests().catch(console.error);
}

module.exports = IntegrationTester;
