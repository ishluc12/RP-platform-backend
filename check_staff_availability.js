require('dotenv').config();
const { supabase } = require('./src/config/database');

async function checkStaffAvailabilityStructure() {
    console.log('=== CHECKING STAFF_AVAILABILITY TABLE ===\n');

    try {
        // 1. Test simple insert without foreign key lookups
        console.log('1. Testing simple insert without foreign key lookups...');
        
        const testData = {
            staff_id: '9b0fcd95-7dd7-4571-98c3-866ef0e1a68f', // Real admin ID
            specific_date: '2025-10-16',
            day_of_week: 3, // Wednesday
            start_time: '09:00:00',
            end_time: '10:00:00',
            availability_type: 'regular',
            slot_duration_minutes: 30,
            max_appointments_per_slot: 3,
            buffer_time_minutes: 5,
            is_active: true
        };

        const { data: insertData, error: insertError } = await supabase
            .from('staff_availability')
            .insert([testData])
            .select()
            .single();

        if (insertError) {
            console.log('❌ Insert failed:', insertError);
            console.log('Error code:', insertError.code);
            console.log('Error details:', insertError.details);
            console.log('Error hint:', insertError.hint);
        } else {
            console.log('✅ Insert successful:', insertData);
            
            // Clean up - delete the test record
            const { error: deleteError } = await supabase
                .from('staff_availability')
                .delete()
                .eq('id', insertData.id);
                
            if (!deleteError) {
                console.log('✅ Test record cleaned up');
            }
        }

        // 2. Test with foreign key lookup
        console.log('\n2. Testing with foreign key lookup...');
        
        const { data: joinData, error: joinError } = await supabase
            .from('staff_availability')
            .select(`
                *,
                staff:staff_id(id, name, email, department, role)
            `)
            .limit(1);

        if (joinError) {
            console.log('❌ Foreign key lookup failed:', joinError);
            
            // Try with users table instead
            console.log('\n3. Trying with users table...');
            const { data: usersData, error: usersError } = await supabase
                .from('staff_availability')
                .select(`
                    *,
                    user:staff_id(id, name, email, role)
                `)
                .limit(1);

            if (usersError) {
                console.log('❌ Users lookup failed:', usersError);
            } else {
                console.log('✅ Users lookup successful:', usersData);
            }
        } else {
            console.log('✅ Foreign key lookup successful:', joinData);
        }

        // 4. Check table structure
        console.log('\n4. Checking available columns...');
        const { data: sampleData, error: sampleError } = await supabase
            .from('staff_availability')
            .select('*')
            .limit(1);

        if (sampleError) {
            console.log('❌ Cannot fetch sample data:', sampleError);
        } else if (sampleData.length > 0) {
            console.log('✅ Sample record structure:');
            console.log('Columns:', Object.keys(sampleData[0]));
            console.log('Sample data:', JSON.stringify(sampleData[0], null, 2));
        } else {
            console.log('ℹ️ No existing records in staff_availability table');
        }

    } catch (error) {
        console.error('❌ Check failed:', error);
    }
}

checkStaffAvailabilityStructure();