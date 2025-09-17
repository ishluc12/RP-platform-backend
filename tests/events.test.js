const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/database');
const { Event } = require('../src/models/Event');

describe('Events API', () => {
    let authToken;
    let testEventId;
    let testUserId;

    beforeAll(async () => {
        // Register a test user
        const userRegisterResponse = await request(app)
            .post('/auth/register')
            .send({
                name: 'Events Test User',
                email: 'eventstestuser@example.com',
                password: 'EventsPass123!',
                role: 'student',
                department: 'Testing'
            });
        testUserId = userRegisterResponse.body.data.user.id;

        // Login as the test user to get token
        const userLoginResponse = await request(app)
            .post('/auth/login')
            .send({
                email: 'eventstestuser@example.com',
                password: 'EventsPass123!'
            });
        authToken = userLoginResponse.body.data.token;
    });

    afterAll(async () => {
        // Cleanup test data
        // await db.end(); // No need to call db.end() here as it's handled globally if needed
    });

    // Test event creation
    describe('Event Creation', () => {
        it('should create a new event with valid data', async () => {
            const eventData = {
                title: 'Test Event',
                description: 'Test event description',
                event_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                location: 'Test Location'
            };

            const response = await request(app)
                .post('/api/shared/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(eventData.title);
            testEventId = response.body.data.id;
        });

        it('should reject event creation with past date', async () => {
            const eventData = {
                title: 'Past Event',
                description: 'Past event description',
                event_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
                location: 'Test Location'
            };

            const response = await request(app)
                .post('/api/shared/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });

    // Test event retrieval
    describe('Event Retrieval', () => {
        it('should get all events with pagination', async () => {
            const response = await request(app)
                .get('/api/shared/events?page=1&limit=10')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.events).toBeDefined();
            expect(response.body.data.pagination).toBeDefined();
        });

        it('should get event by ID', async () => {
            const response = await request(app)
                .get(`/api/shared/events/${testEventId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(testEventId);
        });

        it('should get upcoming events', async () => {
            const response = await request(app)
                .get('/api/shared/events/upcoming')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });

        it('should get past events', async () => {
            const response = await request(app)
                .get('/api/shared/events/past')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data).toBeDefined();
        });
    });

    // Test event search functionality
    describe('Event Search', () => {
        it('should search events by title, description, or location', async () => {
            const response = await request(app)
                .get('/api/shared/events/search?q=Test')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.events).toBeDefined();
        });
    });

    // Test RSVP functionality
    describe('Event RSVP System', () => {
        it('should allow users to RSVP to events', async () => {
            const rsvpData = {
                status: 'going'
            };

            const response = await request(app)
                .post(`/api/shared/events/${testEventId}/rsvp`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(rsvpData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe(rsvpData.status);
        });

        it('should update existing RSVP when user changes status', async () => {
            const rsvpData = {
                status: 'interested'
            };

            const response = await request(app)
                .post(`/api/shared/events/${testEventId}/rsvp`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(rsvpData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBe(rsvpData.status);
            expect(response.body.action).toBe('updated');
        });

        it('should allow users to remove their RSVP', async () => {
            const response = await request(app)
                .delete(`/api/shared/events/${testEventId}/rsvp`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });

        it('should get event participants with pagination', async () => {
            const response = await request(app)
                .get(`/api/shared/events/${testEventId}/participants`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.participants).toBeDefined();
        });

        it('should get user RSVP status for an event', async () => {
            const response = await request(app)
                .get(`/api/shared/events/${testEventId}/rsvp-status`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.status).toBeDefined();
        });

        it('should get events user has RSVP\'d to', async () => {
            const response = await request(app)
                .get('/api/shared/events/rsvp/events')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.events).toBeDefined();
        });

        it('should get event statistics including participant counts', async () => {
            const response = await request(app)
                .get(`/api/shared/events/${testEventId}/stats`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.total_participants).toBeDefined();
        });
    });

    // Test events with participant counts
    describe('Events with Participant Counts', () => {
        it('should get events with participant counts', async () => {
            const response = await request(app)
                .get('/api/student/events/with-participant-counts')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.events).toBeDefined();
        });

        it('should filter events with participant counts', async () => {
            const response = await request(app)
                .get('/api/student/events/with-participant-counts?title=Test')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.events).toBeDefined();
        });
    });

    // Test event filtering and pagination
    describe('Event Filtering and Pagination', () => {
        it('should filter events by creator', async () => {
            const response = await request(app)
                .get(`/api/shared/events/creator/${testUserId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.events).toBeDefined();
        });

        it('should paginate results correctly', async () => {
            const response = await request(app)
                .get('/api/shared/events?page=1&limit=5')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.pagination.page).toBe(1);
            expect(response.body.data.pagination.limit).toBe(5);
        });
    });

    // Test role-based access control
    describe('Role-Based Access Control', () => {
        it('should allow students to view events and RSVP', async () => {
            // Test student access to events and RSVP functionality
            // This would require a student auth token
        });

        it('should allow lecturers to create, manage their events, and view participants', async () => {
            // Test lecturer access to event management and participant viewing
            // This would require a lecturer auth token
        });

        it('should allow admins to manage all events and view all participants', async () => {
            // Test admin access to all event management features
            // This would require an admin auth token
        });
    });

    // Test event update and deletion
    describe('Event Management', () => {
        it('should update event with valid data', async () => {
            const updateData = {
                title: 'Updated Test Event',
                description: 'Updated description'
            };

            const response = await request(app)
                .put(`/api/shared/events/${testEventId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(updateData.title);
        });

        it('should delete event', async () => {
            const response = await request(app)
                .delete(`/api/shared/events/${testEventId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
        });
    });

    // Test validation middleware
    describe('Input Validation', () => {
        it('should reject invalid event data', async () => {
            const invalidEventData = {
                title: '', // Empty title
                event_date: 'invalid-date'
            };

            const response = await request(app)
                .post('/api/shared/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidEventData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });

        it('should reject invalid RSVP status', async () => {
            const invalidRsvpData = {
                status: 'invalid-status'
            };

            const response = await request(app)
                .post(`/api/shared/events/${testEventId}/rsvp`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(invalidRsvpData)
                .expect(400);

            expect(response.body.success).toBe(false);
        });
    });
});
