const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Load environment variables
require('dotenv').config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in environment variables');
    console.error('Please ensure SUPABASE_URL and SUPABASE_ANON_KEY are set');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyDatabaseFix() {
    console.log('🔧 Applying database schema fix...');

    try {
        // Read the SQL fix file
        const sqlFixPath = path.join(__dirname, 'fix_database_schema.sql');
        const sqlFix = fs.readFileSync(sqlFixPath, 'utf8');

        // Execute the SQL fix
        const { data, error } = await supabase.rpc('exec_sql', { sql: sqlFix });

        if (error) {
            console.error('❌ Error applying database fix:', error);
            return false;
        }

        console.log('✅ Database schema fix applied successfully');
        return true;

    } catch (error) {
        console.error('❌ Error reading or applying database fix:', error.message);
        return false;
    }
}

async function verifySchema() {
    console.log('🔍 Verifying database schema...');

    try {
        // Check if availability_type column exists
        const { data, error } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_name', 'staff_availability')
            .eq('column_name', 'availability_type');

        if (error) {
            console.error('❌ Error checking schema:', error);
            return false;
        }

        if (data && data.length > 0) {
            console.log('✅ availability_type column exists');
            console.log('   Column details:', data[0]);
            return true;
        } else {
            console.log('❌ availability_type column still missing');
            return false;
        }

    } catch (error) {
        console.error('❌ Error verifying schema:', error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting database schema fix...\n');

    // Apply the fix
    const fixApplied = await applyDatabaseFix();

    if (fixApplied) {
        // Verify the fix
        const schemaVerified = await verifySchema();

        if (schemaVerified) {
            console.log('\n🎉 Database schema fix completed successfully!');
            console.log('✅ The appointment system should now work properly');
        } else {
            console.log('\n⚠️  Database fix applied but verification failed');
            console.log('   Please check the database manually');
        }
    } else {
        console.log('\n❌ Database fix failed');
        console.log('   Please apply the fix manually using the SQL script');
    }
}

// Run the fix
main().catch(console.error);
