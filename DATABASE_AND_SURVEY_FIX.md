# Database and Survey System Fix

## Issues Identified

### 1. Database Schema Issue
**Problem**: The `staff_availability` table is missing the `availability_type` column, causing the error:
```
Could not find the 'availability_type' column of 'staff_availability' in the schema cache
```

**Solution**: Run the database migration script `fix_database_schema.sql` to add missing columns.

### 2. Survey System Issue
**Problem**: Survey routes are working but require authentication.

**Solution**: Survey routes are properly mounted at `/api/shared/surveys/*` and require valid JWT tokens.

## Database Schema Fix

### Missing Columns in `staff_availability` table:
- `availability_type` (VARCHAR(50), DEFAULT 'regular')
- `break_start_time` (TIME)
- `break_end_time` (TIME)
- `slot_duration_minutes` (INTEGER, DEFAULT 30)
- `max_appointments_per_slot` (INTEGER, DEFAULT 1)
- `buffer_time_minutes` (INTEGER, DEFAULT 0)
- `valid_from` (DATE)
- `valid_to` (DATE)

### How to Apply the Fix:

1. **Run the SQL script**:
   ```bash
   # Connect to your Supabase database and run:
   psql -h your-db-host -U your-username -d your-database -f fix_database_schema.sql
   ```

2. **Or apply via Supabase Dashboard**:
   - Go to your Supabase project dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `fix_database_schema.sql`
   - Execute the script

## Survey System Status

### ✅ Working Routes:
- `GET /api/shared/surveys/templates` - Get survey templates
- `POST /api/shared/surveys/templates` - Create survey template
- `GET /api/shared/surveys/templates/:id` - Get specific template
- `PUT /api/shared/surveys/templates/:id` - Update template
- `DELETE /api/shared/surveys/templates/:id` - Delete template
- `POST /api/shared/surveys/responses` - Submit survey response
- `GET /api/shared/surveys/responses` - Get survey responses
- `GET /api/shared/surveys/statistics/:templateId` - Get survey statistics

### Authentication Required:
All survey routes require a valid JWT token in the Authorization header:
```
Authorization: Bearer <your-jwt-token>
```

## Testing the Fix

### 1. Test Database Schema:
```bash
# After applying the SQL script, test the availability endpoint
curl -X GET "http://localhost:5000/api/staff/appointments/availability" \
  -H "Authorization: Bearer <valid-jwt-token>"
```

### 2. Test Survey System:
```bash
# Test survey templates endpoint
curl -X GET "http://localhost:5000/api/shared/surveys/templates" \
  -H "Authorization: Bearer <valid-jwt-token>"
```

## Expected Results

### After Database Fix:
- ✅ Staff availability creation should work without column errors
- ✅ All appointment system features should function properly
- ✅ Frontend should be able to create availability slots

### Survey System:
- ✅ All survey routes are accessible with proper authentication
- ✅ Survey templates can be created, read, updated, deleted
- ✅ Survey responses can be submitted and retrieved
- ✅ Survey statistics are available

## Next Steps

1. **Apply the database migration** using the provided SQL script
2. **Test the appointment system** to ensure availability creation works
3. **Test the survey system** with proper authentication
4. **Verify frontend integration** works correctly

## Files Modified/Created:
- `backend/fix_database_schema.sql` - Database migration script
- `backend/DATABASE_AND_SURVEY_FIX.md` - This documentation
- `backend/server.js` - Already fixed to include staff routes
- `backend/src/app.js` - Already includes survey routes via shared routes
