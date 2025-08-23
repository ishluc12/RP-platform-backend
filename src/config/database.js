const { createClient } = require('@supabase/supabase-js');

// Load Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
}

// Create Supabase client
const supabase = createClient(supabaseUrl, supabaseKey);

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
    testConnection
};
