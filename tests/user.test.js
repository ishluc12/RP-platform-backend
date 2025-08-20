const request = require('supertest');
const app = require('../server');

describe('User API Tests', () => {
    let authToken;
    let adminToken;

    beforeAll(async () => {
        // Login as admin to get token
        const adminResponse = await request(app)
            .post('/api/auth/login')
            .send({
                email: 'admin@p-community.com',
                password: 'Admin123!'
            });

        adminToken = adminResponse.body.data.token;
    });

    describe('Authentication', () => {
        test('POST /api/auth/register - should register a new user', async () => {
            const newUser = {
                name: 'Test User',
                email: 'testuser@example.com',
                password: 'TestPass123!',
                role: 'student',
                department: 'Computer Science',
                student_id: 'TEST001'
            };

            const response = await request(app)
                .post('/api/auth/register')
                .send(newUser);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.user.email).toBe(newUser.email);
            expect(response.body.data.token).toBeDefined();
        });

        test('POST /api/auth/login - should login with valid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'testuser@example.com',
                    password: 'TestPass123!'
                });

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.token).toBeDefined();

            authToken = response.body.data.token;
        });

        test('POST /api/auth/login - should reject invalid credentials', async () => {
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: 'testuser@example.com',
                    password: 'WrongPassword'
                });

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });
    });

    describe('User Profile', () => {
        test('GET /api/auth/profile - should get current user profile', async () => {
            const response = await request(app)
                .get('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe('testuser@example.com');
        });

        test('PUT /api/auth/profile - should update user profile', async () => {
            const updateData = {
                name: 'Updated Test User',
                bio: 'Updated bio'
            };

            const response = await request(app)
                .put('/api/auth/profile')
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.name).toBe(updateData.name);
            expect(response.body.data.bio).toBe(updateData.bio);
        });
    });

    describe('Shared User Endpoints', () => {
        test('GET /api/shared/users/:id - should get public user profile', async () => {
            const response = await request(app)
                .get('/api/shared/users/1')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(1);
        });

        test('GET /api/shared/users/search - should search users', async () => {
            const response = await request(app)
                .get('/api/shared/users/search?query=test&role=student')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });
    });

    describe('Admin User Management', () => {
        test('GET /api/admin/users - should get all users (admin only)', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('POST /api/admin/users - should create new user (admin only)', async () => {
            const newUser = {
                name: 'Admin Created User',
                email: 'admincreated@example.com',
                password: 'SecurePass123!',
                role: 'lecturer',
                department: 'Computer Science',
                staff_id: 'ADMIN001'
            };

            const response = await request(app)
                .post('/api/admin/users')
                .set('Authorization', `Bearer ${adminToken}`)
                .send(newUser);

            expect(response.status).toBe(201);
            expect(response.body.success).toBe(true);
            expect(response.body.data.email).toBe(newUser.email);
        });

        test('GET /api/admin/users/analytics/overview - should get user analytics (admin only)', async () => {
            const response = await request(app)
                .get('/api/admin/users/analytics/overview')
                .set('Authorization', `Bearer ${adminToken}`);

            expect(response.status).toBe(200);
            expect(response.body.success).toBe(true);
            expect(response.body.data.totalUsers).toBeDefined();
        });
    });

    describe('Error Handling', () => {
        test('GET /api/auth/profile - should reject request without token', async () => {
            const response = await request(app)
                .get('/api/auth/profile');

            expect(response.status).toBe(401);
            expect(response.body.success).toBe(false);
        });

        test('GET /api/admin/users - should reject non-admin users', async () => {
            const response = await request(app)
                .get('/api/admin/users')
                .set('Authorization', `Bearer ${authToken}`);

            expect(response.status).toBe(403);
            expect(response.body.success).toBe(false);
        });
    });
});
