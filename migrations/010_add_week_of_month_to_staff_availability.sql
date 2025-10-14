-- Add week_of_month column to staff_availability table
ALTER TABLE staff_availability ADD COLUMN week_of_month INTEGER CHECK (week_of_month >= 1 AND week_of_month <= 5);

-- Add index for better query performance
CREATE INDEX idx_staff_availability_week ON staff_availability(week_of_month);

-- Add comment for documentation
COMMENT ON COLUMN staff_availability.week_of_month IS 'Week of the month (1-5) for availability planning';
