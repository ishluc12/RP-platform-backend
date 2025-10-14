/**
 * Migration: Add week_of_month column to staff_availability table
 * Run this once to add the column to your database
 */

const { Pool } = require('pg');
require('dotenv').config();

async function runMigration() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🚀 Starting migration: Add week_of_month column...');

        // Add the column
        await pool.query(`
            ALTER TABLE staff_availability 
            ADD COLUMN IF NOT EXISTS week_of_month INTEGER 
            CHECK (week_of_month >= 1 AND week_of_month <= 5);
        `);
        console.log('✅ Column added successfully');

        // Add index
        await pool.query(`
            CREATE INDEX IF NOT EXISTS idx_staff_availability_week 
            ON staff_availability(week_of_month);
        `);
        console.log('✅ Index created successfully');

        // Add comment
        await pool.query(`
            COMMENT ON COLUMN staff_availability.week_of_month 
            IS 'Week of the month (1-5) for availability planning. NULL means applies to all weeks.';
        `);
        console.log('✅ Comment added successfully');

        // Verify the column exists
        const result = await pool.query(`
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'staff_availability' 
            AND column_name = 'week_of_month';
        `);

        if (result.rows.length > 0) {
            console.log('✅ Verification passed:', result.rows[0]);
            console.log('\n🎉 Migration completed successfully!');
        } else {
            console.error('❌ Verification failed: Column not found');
        }

    } catch (error) {
        console.error('❌ Migration failed:', error.message);
        console.error('Full error:', error);
    } finally {
        await pool.end();
    }
}

// Run the migration
runMigration();
