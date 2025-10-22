const { supabaseAdmin } = require('./src/config/database');

async function findLecturerAccounts() {
    console.log('=== FINDING LECTURER ACCOUNTS ===\n');
    
    try {
        // Query for all lecturer users
        const { data: lecturers, error } = await supabaseAdmin
            .from('users')
            .select('*')
            .eq('role', 'lecturer')
            .limit(10);
        
        if (error) {
            console.log('❌ Error querying lecturers:', error.message);
            return;
        }
        
        if (!lecturers || lecturers.length === 0) {
            console.log('❌ No lecturer accounts found');
            
            // Check what roles exist
            console.log('\n=== CHECKING AVAILABLE ROLES ===');
            const { data: allUsers, error: roleError } = await supabaseAdmin
                .from('users')
                .select('role')
                .limit(50);
                
            if (!roleError && allUsers) {
                const roles = [...new Set(allUsers.map(u => u.role))];
                console.log('Available roles:', roles.join(', '));
            }
            
            return;
        }
        
        console.log(`✅ Found ${lecturers.length} lecturer account(s):\n`);
        
        lecturers.forEach((lecturer, index) => {
            console.log(`${index + 1}. ${lecturer.name}`);
            console.log(`   📧 Email: ${lecturer.email}`);
            console.log(`   🆔 ID: ${lecturer.id}`);
            console.log(`   🏛️ Department: ${lecturer.department || 'Not specified'}`);
            console.log(`   👤 Staff ID: ${lecturer.staff_id || 'Not specified'}`);
            console.log(`   📱 Phone: ${lecturer.phone || 'Not specified'}`);
            console.log(`   📝 Bio: ${lecturer.bio || 'Not specified'}`);
            console.log(`   🕐 Created: ${new Date(lecturer.created_at).toLocaleDateString()}`);
            console.log('');
        });
        
        // Show sample appointment data for first lecturer
        if (lecturers[0]) {
            console.log('=== CHECKING APPOINTMENTS FOR FIRST LECTURER ===\n');
            const lecturerId = lecturers[0].id;
            
            const { data: appointments, error: aptError } = await supabaseAdmin
                .from('appointments')
                .select('*')
                .eq('appointee_id', lecturerId)
                .limit(10);
                
            if (!aptError && appointments) {
                console.log(`Found ${appointments.length} appointments for ${lecturers[0].name}:`);
                
                const statusCounts = {};
                appointments.forEach(apt => {
                    statusCounts[apt.status] = (statusCounts[apt.status] || 0) + 1;
                });
                
                Object.entries(statusCounts).forEach(([status, count]) => {
                    console.log(`   ${status}: ${count}`);
                });
                
                console.log('\nSample appointments:');
                appointments.slice(0, 3).forEach((apt, index) => {
                    console.log(`   ${index + 1}. Status: ${apt.status}, Date: ${apt.appointment_date}, Time: ${apt.start_time}`);
                });
            }
        }
        
    } catch (error) {
        console.log('❌ Error:', error.message);
    }
}

findLecturerAccounts().catch(console.error);