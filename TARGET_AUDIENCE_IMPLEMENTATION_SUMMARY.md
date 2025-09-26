# Target Audience Implementation Summary

This document summarizes the implementation of target audience functionality for events in the RP Community Platform backend.

## Overview

The target audience feature allows events to be targeted to specific user roles:
- `students` - Only students can see these events
- `lecturers` - Only lecturers can see these events
- `both` - All users can see these events (default)

## Files Modified

### 1. Database Migration
**File**: `migrations/008_add_target_audience_to_events.sql`
- Created ENUM type `target_audience_enum` with values: 'students', 'lecturers', 'both'
- Added `target_audience` column to `events` table with default value 'both'
- Added database index for performance: `idx_events_target_audience`
- Updated existing events to have 'both' as target_audience for backwards compatibility

**File**: `migrations/runMigrations.js`
- Updated to include the new migration file in the execution list

### 2. Event Model Updates
**File**: `src/models/Event.js`
- Updated `create()` method to accept and handle `target_audience` parameter
- Updated `update()` method to allow updating `target_audience` field
- Enhanced `findAll()` method with role-based filtering logic:
  - Students see events with target_audience: 'students' or 'both'
  - Lecturers see events with target_audience: 'lecturers' or 'both'
  - Admins see all events regardless of target_audience
- Updated `findUpcoming()` method to accept `userRole` parameter for filtering
- Updated `findPast()` method to accept `userRole` parameter for filtering
- Updated `searchEvents()` method to accept `userRole` parameter for filtering

### 3. Shared Event Controller Updates
**File**: `src/controllers/shared/eventController.js`
- Updated `createEvent()` to accept and validate `target_audience` parameter
- Enhanced `getAllEvents()` with automatic role-based filtering based on user's role
- Added validation for target_audience values ('students', 'lecturers', 'both')
- Added new controller methods:
  - `getUpcomingEvents()` - Get upcoming events with role filtering
  - `getPastEvents()` - Get past events with role filtering
  - `searchEvents()` - Search events with role filtering

### 4. Admin Event Controller Updates
**File**: `src/controllers/admin/adminEventController.js`
- Updated `createEvent()` to accept and validate `target_audience` parameter
- Enhanced filtering in `getAllEvents()` and `getEventsWithAdvancedFilters()` to support target_audience filtering
- Added validation for target_audience values
- Admin users can see all events regardless of target_audience (no role-based filtering applied)

### 5. Lecturer Event Controller Updates
**File**: `src/controllers/lecturer/lecturerEventController.js`
- Updated `createEvent()` to accept and validate `target_audience` parameter
- Enhanced `getUpcomingEvents()`, `getPastEvents()`, and `searchEvents()` to use lecturer role filtering
- Lecturers see events targeted to 'lecturers' or 'both'

## API Changes

### Create Event Endpoints
All create event endpoints now accept an optional `target_audience` field:

```json
{
  "title": "Event Title",
  "description": "Event Description",
  "event_date": "2025-01-01T10:00:00Z",
  "location": "Event Location",
  "target_audience": "students" // Optional: 'students', 'lecturers', or 'both'
}
```

### Get Events Endpoints
All get events endpoints now automatically filter based on user role:
- Students only see events with `target_audience: 'students'` or `'both'`
- Lecturers only see events with `target_audience: 'lecturers'` or `'both'`
- Administrators and sys_admins see all events

### New Query Parameters
Events listing endpoints now accept a `target_audience` query parameter for explicit filtering:
```
GET /api/events?target_audience=students
```

## Backwards Compatibility

- All existing events without a target_audience value are automatically set to 'both'
- Existing API calls continue to work without modification
- New target_audience field is optional in create/update requests
- Default value ensures existing functionality is preserved

## Database Schema Changes

```sql
-- New ENUM type
CREATE TYPE target_audience_enum AS ENUM ('students', 'lecturers', 'both');

-- New column added to events table
ALTER TABLE events ADD COLUMN target_audience target_audience_enum DEFAULT 'both';

-- New index for performance
CREATE INDEX idx_events_target_audience ON events(target_audience);
```

## Testing Results

✅ **Event Creation**: Successfully creates events with different target audiences
✅ **Role-Based Filtering**: Proper filtering based on user roles
✅ **ENUM Validation**: Invalid target_audience values are rejected
✅ **Updates**: target_audience can be updated after event creation
✅ **Backwards Compatibility**: Existing events work with new system
✅ **Database Performance**: Index ensures efficient filtering queries

## Usage Examples

### For Students
- See events targeted to 'students' and 'both'
- Cannot see events targeted only to 'lecturers'

### For Lecturers
- See events targeted to 'lecturers' and 'both'
- Cannot see events targeted only to 'students'
- Can create events with any target_audience

### For Administrators
- See all events regardless of target_audience
- Can create events with any target_audience
- Can filter events by target_audience in admin dashboards

## Future Enhancements

Possible future improvements:
1. More granular role targeting (e.g., by department)
2. Event visibility rules based on multiple criteria
3. Notification targeting based on event audience
4. Analytics on event engagement by target audience

## Migration Instructions

1. Run the database migration: `node migrations/runMigrations.js`
2. Restart the backend server to load the updated models and controllers
3. Update frontend applications to optionally send target_audience in event creation requests
4. Test the role-based filtering with different user types

The implementation is complete and ready for production use.