# Manual Database Fix Instructions

## 🚨 CRITICAL: Database Schema Issues

Your database is missing several essential columns that are causing the errors:

### ❌ **Current Errors:**
1. `column appointments.appointment_date does not exist` (500 error)
2. `Could not find the 'availability_type' column` (400 error)
3. 404 errors for availability routes

### ✅ **Solution: Apply This SQL Script**

**Copy and paste this SQL script into your Supabase SQL Editor and execute it:**

```sql
-- ===============================================
-- COMPLETE DATABASE SCHEMA FIX
-- ===============================================

-- Fix appointments table - add missing columns
DO $$ 
BEGIN 
    -- Add appointment_date column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'appointment_date'
    ) THEN
        ALTER TABLE appointments ADD COLUMN appointment_date DATE;
        
        -- If appointment_time exists, migrate data
        IF EXISTS (
            SELECT 1 FROM information_schema.columns 
            WHERE table_name = 'appointments' AND column_name = 'appointment_time'
        ) THEN
            UPDATE appointments 
            SET appointment_date = appointment_time::date 
            WHERE appointment_date IS NULL;
        END IF;
    END IF;
    
    -- Add start_time and end_time if they don't exist
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'start_time'
    ) THEN
        ALTER TABLE appointments ADD COLUMN start_time TIME;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'end_time'
    ) THEN
        ALTER TABLE appointments ADD COLUMN end_time TIME;
    END IF;
    
    -- Add other missing columns to appointments
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'student_notes'
    ) THEN
        ALTER TABLE appointments ADD COLUMN student_notes TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'staff_notes'
    ) THEN
        ALTER TABLE appointments ADD COLUMN staff_notes TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'responded_at'
    ) THEN
        ALTER TABLE appointments ADD COLUMN responded_at TIMESTAMP;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'appointments' AND column_name = 'response_message'
    ) THEN
        ALTER TABLE appointments ADD COLUMN response_message TEXT;
    END IF;
END $$;

-- Fix staff_availability table - add missing columns
DO $$ 
BEGIN 
    -- Add availability_type column
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_availability' AND column_name = 'availability_type'
    ) THEN
        ALTER TABLE staff_availability ADD COLUMN availability_type VARCHAR(50) DEFAULT 'regular';
    END IF;
    
    -- Add break_start_time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_availability' AND column_name = 'break_start_time'
    ) THEN
        ALTER TABLE staff_availability ADD COLUMN break_start_time TIME;
    END IF;
    
    -- Add break_end_time
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_availability' AND column_name = 'break_end_time'
    ) THEN
        ALTER TABLE staff_availability ADD COLUMN break_end_time TIME;
    END IF;
    
    -- Add slot_duration_minutes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_availability' AND column_name = 'slot_duration_minutes'
    ) THEN
        ALTER TABLE staff_availability ADD COLUMN slot_duration_minutes INTEGER DEFAULT 30;
    END IF;
    
    -- Add max_appointments_per_slot
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_availability' AND column_name = 'max_appointments_per_slot'
    ) THEN
        ALTER TABLE staff_availability ADD COLUMN max_appointments_per_slot INTEGER DEFAULT 1;
    END IF;
    
    -- Add buffer_time_minutes
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_availability' AND column_name = 'buffer_time_minutes'
    ) THEN
        ALTER TABLE staff_availability ADD COLUMN buffer_time_minutes INTEGER DEFAULT 0;
    END IF;
    
    -- Add valid_from
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_availability' AND column_name = 'valid_from'
    ) THEN
        ALTER TABLE staff_availability ADD COLUMN valid_from DATE;
    END IF;
    
    -- Add valid_to
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'staff_availability' AND column_name = 'valid_to'
    ) THEN
        ALTER TABLE staff_availability ADD COLUMN valid_to DATE;
    END IF;
END $$;

-- Update constraints
ALTER TABLE staff_availability DROP CONSTRAINT IF EXISTS staff_availability_day_of_week_check;
ALTER TABLE staff_availability ADD CONSTRAINT staff_availability_day_of_week_check 
    CHECK (day_of_week >= 0 AND day_of_week <= 6);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(appointment_date);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_requester ON appointments(requester_id);
CREATE INDEX IF NOT EXISTS idx_appointments_appointee ON appointments(appointee_id);
CREATE INDEX IF NOT EXISTS idx_staff_availability_type ON staff_availability(availability_type);
CREATE INDEX IF NOT EXISTS idx_staff_availability_valid_period ON staff_availability(valid_from, valid_to);

-- Add comments
COMMENT ON COLUMN appointments.appointment_date IS 'Date of the appointment';
COMMENT ON COLUMN appointments.start_time IS 'Start time of the appointment';
COMMENT ON COLUMN appointments.end_time IS 'End time of the appointment';
COMMENT ON COLUMN appointments.student_notes IS 'Notes from the student';
COMMENT ON COLUMN appointments.staff_notes IS 'Notes from the staff member';
COMMENT ON COLUMN staff_availability.availability_type IS 'regular, temporary, special';
COMMENT ON COLUMN staff_availability.day_of_week IS '0 = Sunday, 6 = Saturday';
```

## 📋 **Step-by-Step Instructions:**

### 1. **Open Supabase Dashboard**
- Go to your Supabase project dashboard
- Navigate to **SQL Editor**

### 2. **Execute the SQL Script**
- Copy the entire SQL script above
- Paste it into the SQL Editor
- Click **Run** to execute

### 3. **Verify the Fix**
- Check that the script executed without errors
- You should see success messages

### 4. **Test Your Application**
- Restart your frontend application
- Try creating appointments and surveys
- The errors should be resolved

## ✅ **Expected Results After Fix:**

1. **Appointments System**: ✅ Working
   - No more `appointment_date` column errors
   - All appointment operations functional
   - Proper authentication and authorization

2. **Surveys System**: ✅ Working
   - All survey routes accessible
   - Survey creation and management works
   - Statistics and analytics available

3. **Staff Availability**: ✅ Working
   - No more `availability_type` column errors
   - Availability creation works
   - All staff routes functional

## 🚨 **If You Still Get Errors:**

1. **Check the SQL execution** - Make sure all statements ran successfully
2. **Restart your backend server** - `node server.js`
3. **Clear browser cache** - Hard refresh your frontend
4. **Check console logs** - Look for any remaining errors

## 📞 **Need Help?**

If you're still having issues after applying this fix, please share:
1. Any error messages from the SQL execution
2. Any remaining frontend errors
3. The current status of your application

This fix should resolve all the database schema issues and make both the appointment and survey systems work properly! 🎉
