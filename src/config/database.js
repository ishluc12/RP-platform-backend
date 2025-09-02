const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');

// Load Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;
// Try multiple common env var names for the service role key
const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_ROLE ||
    process.env.SUPABASE_SECRET ||
    process.env.SUPABASE_ADMIN_KEY;

// ADD THESE LINES FOR DEBUGGING
console.log('SUPABASE_URL status:', supabaseUrl ? 'Set' : 'Not Set');
console.log('SUPABASE_ANON_KEY status:', supabaseKey ? 'Set' : 'Not Set');
console.log('SUPABASE_SERVICE_KEY (or variant) status:', supabaseServiceKey ? 'Set' : 'Not Set');


if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

// PostgreSQL connection details for the `pg` client
const pgConfig = {
    connectionString: process.env.DATABASE_URL || supabaseUrl, // Use DATABASE_URL if available, or Supabase URL
    ssl: { rejectUnauthorized: false } // Required for Supabase connections
};

const pool = new Pool(pgConfig);

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);
// Create admin client if service key is provided
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Optional: Test database connection
const testConnection = async () => {
    try {
        // Test connection using the pg pool
        const client = await pool.connect();
        await client.query('SELECT 1');
        client.release();
        console.log('✅ Database connected successfully via pg pool');
        return true;
    } catch (error) {
        console.error('❌ Database connection error via pg pool:', error.message);
        return false;
    }
};

module.exports = {
    supabase,
    supabaseAdmin,
    testConnection,
    pgPool: pool // Export the pg pool
};
