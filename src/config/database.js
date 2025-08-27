const { createClient } = require('@supabase/supabase-js');

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

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);
// Create admin client if service key is provided
const supabaseAdmin = supabaseServiceKey ? createClient(supabaseUrl, supabaseServiceKey) : null;

// Optional: Test database connection
const testConnection = async () => {
    try {
        const { data, error } = await supabase
            .from('users') // Adjust table name as needed
            .select('id')   // Select any column to test
            .limit(1);

        if (error) {
            console.error('❌ Database connection failed:', error.message);
            return false;
        }

        console.log('✅ Database connected successfully');
        return true;
    } catch (error) {
        console.error('❌ Database connection error:', error.message);
        return false;
    }
};

module.exports = {
    supabase,
    supabaseAdmin,
    testConnection
};
