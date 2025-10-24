const request = require('supertest');
const app = require('../server');

describe('Student Feedback API Tests', () => {
    let authToken;
    let testFeedbackId;

    beforeAll(async () => {
        // Login as test user to get token
        const loginResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'testuser@example.com',
                password: 'TestPass123!'
            });
        
        authToken = loginResponse.body.data.token;
    });

    describe('POST /api/student/feedback - Submit Feedback', () => {
        test('should submit feedback successfully', async () => {
            const feedbackData = {
                subject: 'Test Feedback Subject',
                message: 'This is a test feedback message',
                category: 'general',
                priority: 'medium',
                anonymous: false
            };

            const response = await request(app)
                .post('/api/student/feedback')
                .set('Authorization', `Bearer ${authToken}`)
                .send(feedbackData);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.subject).toBe(feedbackData.subject);
            expect(response.body.data.message).toBe(feedbackData.message);
            
            // Store the feedback ID for later tests
            testFeedbackId = response.body.data.id;
        });

        test('should reject feedback without required fields', async () => {
            const feedbackData = {
                message: 'This is a test feedback message'
                // Missing subject
            };

            const response = await request(app)
                .post('/api/student/feedback')
                .set('Authorization', `Bearer ${authToken}`)
                .send(feedbackData);

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Subject and message are required');
        });
    });

    describe('GET /api/student/feedback/history - Get Feedback History', () => {
        test('should get student feedback history', async () => {
            const response = await request(app)
                .get('/api/student/feedback/history')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
            expect(response.body.data.length).toBeGreaterThan(0);
        });
    });

    describe('GET /api/student/feedback/:id - Get Feedback by ID', () => {
        test('should get specific feedback by ID', async () => {
            const response = await request(app)
                .get(`/api/student/feedback/${testFeedbackId}`)
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testFeedbackId);
            expect(response.body.data.subject).toBe('Test Feedback Subject');
        });

        test('should return 404 for non-existent feedback', async () => {
            const response = await request(app)
                .get('/api/student/feedback/nonexistent-id')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(404);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Feedback not found');
        });
    });

    describe('PUT /api/student/feedback/:id - Update Feedback', () => {
        test('should update feedback successfully', async () => {
            const updateData = {
                subject: 'Updated Feedback Subject',
                message: 'This is an updated feedback message'
            };

            const response = await request(app)
                .put(`/api/student/feedback/${testFeedbackId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.subject).toBe(updateData.subject);
            expect(response.body.data.message).toBe(updateData.message);
        });

        test('should reject update with no fields provided', async () => {
            const response = await request(app)
                .put(`/api/student/feedback/${testFeedbackId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send({});

            expect(response.status).toBe(400);
            expect(response.body.success).toBe(false);
            expect(response.body.message).toBe('Subject or message is required');
        });
    });
});