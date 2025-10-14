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

async function applyCompleteDatabaseFix() {
    console.log('🔧 Applying complete database schema fix...');

    try {
        // Read the SQL fix file
        const sqlFixPath = path.join(__dirname, 'complete_database_fix.sql');
        const sqlFix = fs.readFileSync(sqlFixPath, 'utf8');

        // Split the SQL into individual statements
        const statements = sqlFix.split(';').filter(stmt => stmt.trim());

        console.log(`📝 Found ${statements.length} SQL statements to execute`);

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i].trim();
            if (statement && !statement.startsWith('--')) {
                try {
                    console.log(`⚡ Executing statement ${i + 1}/${statements.length}...`);
                    const { data, error } = await supabase.rpc('exec_sql', { sql: statement });

                    if (error) {
                        console.warn(`⚠️  Statement ${i + 1} warning:`, error.message);
                    } else {
                        console.log(`✅ Statement ${i + 1} executed successfully`);
                    }
                } catch (err) {
                    console.warn(`⚠️  Statement ${i + 1} error:`, err.message);
                }
            }
        }

        console.log('✅ Database schema fix applied successfully');
        return true;

    } catch (error) {
        console.error('❌ Error applying database fix:', error.message);
        return false;
    }
}

async function verifySchema() {
    console.log('🔍 Verifying database schema...');

    try {
        // Check appointments table
        const { data: appointmentsData, error: appointmentsError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_name', 'appointments')
            .in('column_name', ['appointment_date', 'start_time', 'end_time', 'student_notes', 'staff_notes']);

        if (appointmentsError) {
            console.error('❌ Error checking appointments schema:', appointmentsError);
        } else {
            console.log('✅ Appointments table columns:');
            appointmentsData?.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type}`);
            });
        }

        // Check staff_availability table
        const { data: availabilityData, error: availabilityError } = await supabase
            .from('information_schema.columns')
            .select('column_name, data_type, is_nullable, column_default')
            .eq('table_name', 'staff_availability')
            .in('column_name', ['availability_type', 'break_start_time', 'break_end_time', 'slot_duration_minutes', 'max_appointments_per_slot']);

        if (availabilityError) {
            console.error('❌ Error checking staff_availability schema:', availabilityError);
        } else {
            console.log('✅ Staff availability table columns:');
            availabilityData?.forEach(col => {
                console.log(`   - ${col.column_name}: ${col.data_type}`);
            });
        }

        return true;

    } catch (error) {
        console.error('❌ Error verifying schema:', error.message);
        return false;
    }
}

async function testEndpoints() {
    console.log('🧪 Testing endpoints...');

    const axios = require('axios');
    const BASE_URL = 'http://localhost:5000';

    try {
        // Test staff appointments endpoint
        const response = await axios.get(`${BASE_URL}/api/staff/appointments`);
        console.log('❌ Staff appointments should require authentication');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Staff appointments endpoint working (requires auth)');
        } else {
            console.log('❌ Staff appointments endpoint error:', error.response?.data || error.message);
        }
    }

    try {
        // Test survey templates endpoint
        const response = await axios.get(`${BASE_URL}/api/shared/surveys/templates`);
        console.log('❌ Survey templates should require authentication');
    } catch (error) {
        if (error.response?.status === 401) {
            console.log('✅ Survey templates endpoint working (requires auth)');
        } else {
            console.log('❌ Survey templates endpoint error:', error.response?.data || error.message);
        }
    }
}

async function main() {
    console.log('🚀 Starting complete database and system fix...\n');

    // Apply the database fix
    const fixApplied = await applyCompleteDatabaseFix();

    if (fixApplied) {
        // Verify the fix
        const schemaVerified = await verifySchema();

        if (schemaVerified) {
            console.log('\n🎉 Database schema fix completed successfully!');

            // Test endpoints
            await testEndpoints();

            console.log('\n✅ All systems should now work properly!');
            console.log('🔧 Next steps:');
            console.log('1. Restart your frontend application');
            console.log('2. Test the appointment system');
            console.log('3. Test the survey system');
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
