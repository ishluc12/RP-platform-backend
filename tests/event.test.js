const request = require('supertest');
const app = require('../src/app');
const Event = require('../src/models/Event');
const db = require('../src/config/database');

describe('Event API Tests', () => {
    let authToken;
    let testEventId;

    beforeAll(async () => {
        // Setup test database connection
        // This would typically involve setting up a test database
        console.log('Setting up test environment...');
    });

    afterAll(async () => {
        // Cleanup test database
        await db.end();
    });

    beforeEach(async () => {
        // Setup test data before each test
        // This would typically involve creating test users and getting auth tokens
    });

    afterEach(async () => {
        // Cleanup test data after each test
        if (testEventId) {
            try {
                await Event.delete(testEventId);
            } catch (error) {
                console.log('Cleanup error:', error.message);
            }
        }
    });

    describe('Event Model Tests', () => {
        test('should create a new event', async () => {
            const eventData = {
                title: 'Test Event',
                description: 'Test Description',
                event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                location: 'Test Location',
                created_by: 1
            };

            const result = await Event.create(eventData);
            expect(result.success).toBe(true);
            expect(result.data.title).toBe(eventData.title);
            expect(result.data.description).toBe(eventData.description);
            
            testEventId = result.data.id;
        });

        test('should find event by ID', async () => {
            const eventData = {
                title: 'Test Event for Find',
                description: 'Test Description for Find',
                event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                location: 'Test Location for Find',
                created_by: 1
            };

            const createdEvent = await Event.create(eventData);
            expect(createdEvent.success).toBe(true);

            const foundEvent = await Event.findById(createdEvent.data.id);
            expect(foundEvent.success).toBe(true);
            expect(foundEvent.data.title).toBe(eventData.title);
            
            testEventId = createdEvent.data.id;
        });

        test('should find all events with pagination', async () => {
            const result = await Event.findAll(1, 5);
            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
            expect(result.pagination).toBeDefined();
            expect(result.pagination.page).toBe(1);
            expect(result.pagination.limit).toBe(5);
        });

        test('should find upcoming events', async () => {
            const result = await Event.findUpcoming(5);
            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
            
            // All events should be in the future
            result.data.forEach(event => {
                const eventDate = new Date(event.event_date);
                const now = new Date();
                expect(eventDate > now).toBe(true);
            });
        });

        test('should find past events', async () => {
            const result = await Event.findPast(5);
            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
        });

        test('should search events', async () => {
            const searchTerm = 'test';
            const result = await Event.searchEvents(searchTerm, 1, 5);
            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
        });

        test('should find events by creator', async () => {
            const creatorId = 1;
            const result = await Event.findByCreator(creatorId, 1, 5);
            expect(result.success).toBe(true);
            expect(Array.isArray(result.data)).toBe(true);
            
            // All events should be created by the specified user
            result.data.forEach(event => {
                expect(event.created_by).toBe(creatorId);
            });
        });

        test('should update event', async () => {
            const eventData = {
                title: 'Test Event for Update',
                description: 'Test Description for Update',
                event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                location: 'Test Location for Update',
                created_by: 1
            };

            const createdEvent = await Event.create(eventData);
            expect(createdEvent.success).toBe(true);

            const updateData = {
                title: 'Updated Test Event',
                description: 'Updated Test Description'
            };

            const updatedEvent = await Event.update(createdEvent.data.id, updateData);
            expect(updatedEvent.success).toBe(true);
            expect(updatedEvent.data.title).toBe(updateData.title);
            expect(updatedEvent.data.description).toBe(updateData.description);
            
            testEventId = createdEvent.data.id;
        });

        test('should delete event', async () => {
            const eventData = {
                title: 'Test Event for Delete',
                description: 'Test Description for Delete',
                event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                location: 'Test Location for Delete',
                created_by: 1
            };

            const createdEvent = await Event.create(eventData);
            expect(createdEvent.success).toBe(true);

            const deletedEvent = await Event.delete(createdEvent.data.id);
            expect(deletedEvent.success).toBe(true);
            expect(deletedEvent.data.id).toBe(createdEvent.data.id);

            // Verify event is deleted
            const foundEvent = await Event.findById(createdEvent.data.id);
            expect(foundEvent.success).toBe(false);
        });
    });

    describe('Event API Endpoint Tests', () => {
        test('GET /api/shared/events should return all events', async () => {
            const response = await request(app)
                .get('/api/shared/events')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.events)).toBe(true);
            expect(response.body.data.pagination).toBeDefined();
        });

        test('GET /api/shared/events/upcoming should return upcoming events', async () => {
            const response = await request(app)
                .get('/api/shared/events/upcoming')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('GET /api/shared/events/past should return past events', async () => {
            const response = await request(app)
                .get('/api/shared/events/past')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data)).toBe(true);
        });

        test('GET /api/shared/events/search should return search results', async () => {
            const response = await request(app)
                .get('/api/shared/events/search?q=test')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(Array.isArray(response.body.data.events)).toBe(true);
            expect(response.body.data.searchQuery).toBe('test');
        });

        test('POST /api/shared/events should create a new event', async () => {
            const eventData = {
                title: 'API Test Event',
                description: 'API Test Description',
                event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                location: 'API Test Location'
            };

            const response = await request(app)
                .post('/api/shared/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData)
                .expect(201);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(eventData.title);
            expect(response.body.data.description).toBe(eventData.description);
            
            testEventId = response.body.data.id;
        });

        test('GET /api/shared/events/:id should return specific event', async () => {
            // First create an event
            const eventData = {
                title: 'API Test Event for Get',
                description: 'API Test Description for Get',
                event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                location: 'API Test Location for Get'
            };

            const createResponse = await request(app)
                .post('/api/shared/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData);

            const eventId = createResponse.body.data.id;
            testEventId = eventId;

            // Then get the event
            const response = await request(app)
                .get(`/api/shared/events/${eventId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(eventId);
            expect(response.body.data.title).toBe(eventData.title);
        });

        test('PUT /api/shared/events/:id should update event', async () => {
            // First create an event
            const eventData = {
                title: 'API Test Event for Update',
                description: 'API Test Description for Update',
                event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                location: 'API Test Location for Update'
            };

            const createResponse = await request(app)
                .post('/api/shared/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData);

            const eventId = createResponse.body.data.id;
            testEventId = eventId;

            // Then update the event
            const updateData = {
                title: 'Updated API Test Event',
                description: 'Updated API Test Description'
            };

            const response = await request(app)
                .put(`/api/shared/events/${eventId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .send(updateData)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.title).toBe(updateData.title);
            expect(response.body.data.description).toBe(updateData.description);
        });

        test('DELETE /api/shared/events/:id should delete event', async () => {
            // First create an event
            const eventData = {
                title: 'API Test Event for Delete',
                description: 'API Test Description for Delete',
                event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                location: 'API Test Location for Delete'
            };

            const createResponse = await request(app)
                .post('/api/shared/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData);

            const eventId = createResponse.body.data.id;

            // Then delete the event
            const response = await request(app)
                .delete(`/api/shared/events/${eventId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(200);

            expect(response.body.success).toBe(true);
            expect(response.body.data.id).toBe(eventId);

            // Verify event is deleted
            const getResponse = await request(app)
                .get(`/api/shared/events/${eventId}`)
                .set('Authorization', `Bearer ${authToken}`)
                .expect(404);
        });
    });

    describe('Event Validation Tests', () => {
        test('should reject event with missing title', async () => {
            const eventData = {
                description: 'Test Description',
                event_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                location: 'Test Location'
            };

            const response = await request(app)
                .post('/api/shared/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('Title');
        });

        test('should reject event with missing event_date', async () => {
            const eventData = {
                title: 'Test Event',
                description: 'Test Description',
                location: 'Test Location'
            };

            const response = await request(app)
                .post('/api/shared/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('event date');
        });

        test('should reject event with past date', async () => {
            const eventData = {
                title: 'Test Event',
                description: 'Test Description',
                event_date: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
                location: 'Test Location'
            };

            const response = await request(app)
                .post('/api/shared/events')
                .set('Authorization', `Bearer ${authToken}`)
                .send(eventData)
                .expect(400);

            expect(response.body.success).toBe(false);
            expect(response.body.message).toContain('future');
        });
    });

    describe('Event Permission Tests', () => {
        test('should allow creator to update their own event', async () => {
            // This test would verify that users can only update events they created
            // Implementation depends on authentication setup
        });

        test('should allow creator to delete their own event', async () => {
            // This test would verify that users can only delete events they created
            // Implementation depends on authentication setup
        });

        test('should prevent non-creator from updating event', async () => {
            // This test would verify that users cannot update events they didn't create
            // Implementation depends on authentication setup
        });

        test('should prevent non-creator from deleting event', async () => {
            // This test would verify that users cannot delete events they didn't create
            // Implementation depends on authentication setup
        });
    });
});
