require('dotenv').config();
const { supabase } = require('./src/config/database');

// Debug function to check user authentication and database issues
async function debugUserAuthentication() {
    console.log('=== USER AUTHENTICATION DEBUG ===\n');

    try {
        // 1. Check all users and their roles
        console.log('1. Checking all users in database:');
        const { data: allUsers, error: usersError } = await supabase
            .from('users')
            .select('id, email, role, name')
            .order('created_at', { ascending: false })
            .limit(10);

        if (usersError) {
            console.error('❌ Error fetching users:', usersError);
            return;
        }

        console.log('📊 Recent users:');
        allUsers.forEach(user => {
            console.log(`   ${user.email} | Role: ${user.role} | ID: ${user.id}`);
        });

        // 2. Find administrator users
        console.log('\n2. Looking for administrator users:');
        const adminUsers = allUsers.filter(user => ['administrator', 'admin', 'sys_admin'].includes(user.role));
        
        if (adminUsers.length === 0) {
            console.log('❌ No administrator users found!');
            console.log('\n🔧 SOLUTION: Create an administrator account:');
            console.log('   Option 1: Update existing user role:');
            console.log('   UPDATE users SET role = \'administrator\' WHERE email = \'your-email@example.com\';');
            console.log('\n   Option 2: Register a new account and update its role');
        } else {
            console.log('✅ Administrator users found:');
            adminUsers.forEach(user => {
                console.log(`   ${user.email} | Role: ${user.role} | ID: ${user.id}`);
            });
        }

        // 3. Check staff_availability table
        console.log('\n3. Checking staff_availability table structure:');
        const { data: availabilityData, error: availError } = await supabase
            .from('staff_availability')
            .select('*')
            .limit(5);

        if (availError) {
            console.error('❌ Error checking staff_availability:', availError);
        } else {
            console.log(`📊 Found ${availabilityData.length} availability records`);
            if (availabilityData.length > 0) {
                console.log('Sample record:', JSON.stringify(availabilityData[0], null, 2));
            }
        }

        // 4. Check if staff_id is UUID format
        if (availabilityData.length > 0) {
            const sampleStaffId = availabilityData[0].staff_id;
            const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            const isValidUuid = uuidPattern.test(sampleStaffId);
            console.log(`\n4. Staff ID format check:`);
            console.log(`   Sample staff_id: ${sampleStaffId}`);
            console.log(`   Is valid UUID: ${isValidUuid}`);
        }

    } catch (error) {
        console.error('❌ Debug failed:', error);
    }
}

debugUserAuthentication();