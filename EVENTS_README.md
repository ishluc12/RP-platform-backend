# Events Management System

This document describes the complete events management system with RSVP functionality implemented in the backend.

## Database Schema

### Events Table
```sql
CREATE TABLE events (
    id SERIAL PRIMARY KEY,
    title VARCHAR NOT NULL,
    description TEXT,
    event_date TIMESTAMP NOT NULL,
    location VARCHAR,
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### RSVP Status ENUM
```sql
CREATE TYPE rsvp_status AS ENUM ('interested', 'going', 'not going');
```

### Event Participants Table
```sql
CREATE TABLE event_participants (
    id SERIAL PRIMARY KEY,
    event_id INTEGER REFERENCES events(id),
    user_id INTEGER REFERENCES users(id),
    status rsvp_status DEFAULT 'interested',
    responded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## API Endpoints

### Shared Events (All Authenticated Users)

#### Event CRUD Operations
- `POST /api/shared/events` - Create a new event
- `GET /api/shared/events` - Get all events with pagination and filters
- `GET /api/shared/events/:id` - Get event by ID
- `PUT /api/shared/events/:id` - Update event (creator or admin only)
- `DELETE /api/shared/events/:id` - Delete event (creator or admin only)

#### Event Queries
- `GET /api/shared/events/upcoming` - Get upcoming events
- `GET /api/shared/events/past` - Get past events
- `GET /api/shared/events/search?q=query` - Search events
- `GET /api/shared/events/my-events` - Get user's own events
- `GET /api/shared/events/creator/:userId` - Get events by specific creator

#### RSVP and Participant Management
- `POST /api/shared/events/:id/rsvp` - RSVP to an event
- `DELETE /api/shared/events/:id/rsvp` - Remove RSVP from an event
- `GET /api/shared/events/:id/participants` - Get event participants
- `GET /api/shared/events/:id/rsvp-status` - Get user's RSVP status for an event
- `GET /api/shared/events/:id/stats` - Get event statistics
- `GET /api/shared/events/rsvp/events` - Get events user has RSVP'd to

### Student Events (Student Role)

#### Read-Only Event Access
- `GET /api/student/events` - Get all events
- `GET /api/student/events/upcoming` - Get upcoming events
- `GET /api/student/events/past` - Get past events
- `GET /api/student/events/search` - Search events
- `GET /api/student/events/:id` - Get event by ID
- `GET /api/student/events/creator/:userId` - Get events by creator
- `GET /api/student/events/department/:department` - Get events by department
- `GET /api/student/events/today` - Get today's events
- `GET /api/student/events/this-week` - Get this week's events
- `GET /api/student/events/this-month` - Get this month's events

#### Enhanced Event Views
- `GET /api/student/events/with-participant-counts` - Get events with participant counts

#### RSVP Functionality
- `POST /api/student/events/:id/rsvp` - RSVP to an event
- `DELETE /api/student/events/:id/rsvp` - Remove RSVP
- `GET /api/student/events/:id/participants` - View event participants
- `GET /api/student/events/:id/rsvp-status` - Check RSVP status
- `GET /api/student/events/:id/stats` - View event statistics
- `GET /api/student/events/rsvp/events` - View RSVP'd events

### Lecturer Events (Lecturer Role)

#### Event Management
- `POST /api/lecturer/events` - Create a new event
- `GET /api/lecturer/events/my-events` - Get lecturer's own events
- `GET /api/lecturer/events/upcoming` - Get upcoming events
- `GET /api/lecturer/events/past` - Get past events
- `PUT /api/lecturer/events/:id` - Update lecturer's own event
- `DELETE /api/lecturer/events/:id` - Delete lecturer's own event
- `GET /api/lecturer/events/:id` - Get any event by ID
- `GET /api/lecturer/events/search` - Search all events

#### Event Analytics
- `GET /api/lecturer/events/stats` - Get lecturer's event statistics
- `GET /api/lecturer/events/:id/participants` - View participants for lecturer's events
- `GET /api/lecturer/events/:id/stats` - View statistics for lecturer's events

### Admin Events (Admin/Sys_Admin Role)

#### Full Event Management
- `GET /api/admin/events` - Get all events with admin privileges
- `GET /api/admin/events/stats` - Get comprehensive event statistics
- `PUT /api/admin/events/:id` - Update any event
- `DELETE /api/admin/events/:id` - Delete any event
- `GET /api/admin/events/user/:userId` - Get events by specific user
- `POST /api/admin/events/bulk-delete` - Bulk delete events
- `GET /api/admin/events/advanced-filters` - Advanced event filtering

## Features

### Event Management
- **CRUD Operations**: Full create, read, update, delete functionality
- **Validation**: Input validation for event data including future date requirements
- **Authorization**: Role-based access control for event management
- **Pagination**: Efficient pagination for large event lists
- **Filtering**: Multiple filter options (title, location, creator, date range)
- **Search**: Full-text search across title, description, and location

### RSVP System
- **Multiple Statuses**: Users can RSVP as 'interested', 'going', or 'not going'
- **Status Updates**: Users can change their RSVP status
- **RSVP Removal**: Users can remove their RSVP entirely
- **Participant Tracking**: Track all participants for each event
- **Statistics**: Comprehensive participant statistics and counts

### Role-Based Access
- **Students**: Can view events, RSVP, and see participant counts
- **Lecturers**: Can create/manage their own events and view participants
- **Admins**: Full access to all events and management features

### Advanced Features
- **Participant Counts**: Events can be viewed with participant counts
- **Event Statistics**: Detailed analytics for event participation
- **Department Filtering**: Filter events by department
- **Time-based Queries**: Today, this week, this month event views
- **Creator Tracking**: Track who created each event

## Data Models

### Event Model
The Event model provides comprehensive database operations:
- Basic CRUD operations
- Advanced queries with filters and pagination
- RSVP management
- Participant tracking
- Statistics generation

### Key Methods
- `create(eventData)` - Create new event
- `findById(id)` - Find event by ID
- `findAll(page, limit, filters)` - Get paginated events with filters
- `rsvpToEvent(eventId, userId, status)` - Handle RSVP operations
- `getEventParticipants(eventId, page, limit)` - Get event participants
- `getEventStats(eventId)` - Get event statistics
- `getEventsWithParticipantCounts(page, limit, filters)` - Get events with participant counts

## Validation

### Event Validation
- Title is required and must be non-empty
- Event date must be in the future
- Location and description are optional
- All fields are properly sanitized

### RSVP Validation
- Status must be one of: 'interested', 'going', 'not going'
- Event must exist
- User must be authenticated

## Error Handling

The system provides comprehensive error handling:
- Input validation errors (400)
- Authentication errors (401)
- Authorization errors (403)
- Resource not found errors (404)
- Server errors (500)

All errors include descriptive messages and proper HTTP status codes.

## Testing

Comprehensive test coverage includes:
- Event CRUD operations
- RSVP functionality
- Role-based access control
- Input validation
- Error handling
- Pagination and filtering

## Seeding

The system includes seeders for:
- Sample events with realistic data
- RSVP data for testing
- User role verification

## Usage Examples

### Creating an Event
```javascript
const eventData = {
    title: 'Department Seminar',
    description: 'Monthly research presentation',
    event_date: '2024-02-15T14:00:00Z',
    location: 'Main Auditorium'
};

const response = await fetch('/api/shared/events', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(eventData)
});
```

### RSVP to an Event
```javascript
const rsvpData = {
    status: 'going'
};

const response = await fetch('/api/shared/events/123/rsvp', {
    method: 'POST',
    headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
    },
    body: JSON.stringify(rsvpData)
});
```

### Getting Events with Participant Counts
```javascript
const response = await fetch('/api/student/events/with-participant-counts?page=1&limit=10', {
    headers: {
        'Authorization': `Bearer ${token}`
    }
});
```

## Security Features

- **Authentication Required**: All endpoints require valid JWT tokens
- **Role-Based Access**: Different functionality based on user roles
- **Input Sanitization**: All user inputs are properly validated and sanitized
- **SQL Injection Protection**: Parameterized queries prevent SQL injection
- **Authorization Checks**: Users can only modify events they created (unless admin)

## Performance Considerations

- **Pagination**: Efficient handling of large event lists
- **Database Indexing**: Proper indexing on frequently queried fields
- **Query Optimization**: Optimized SQL queries with proper JOINs
- **Caching Ready**: Structure supports future caching implementation

This events management system provides a robust, secure, and scalable solution for managing campus events with comprehensive RSVP functionality and role-based access control.
