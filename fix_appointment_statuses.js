const { supabase } = require('./src/config/database');

async function fixAppointmentStatuses() {
    console.log('🔧 Starting appointment status fix...\n');

    try {
        // Step 1: Check for invalid statuses
        console.log('Step 1: Checking for invalid statuses...');
        const { data: invalidAppointments, error: checkError } = await supabase
            .from('appointments')
            .select('id, status, appointment_time')
            .not('status', 'in', '(pending,accepted,declined,completed,cancelled,rescheduled)');

        if (checkError) {
            console.error('Error checking appointments:', checkError);
            throw checkError;
        }

        console.log(`Found ${invalidAppointments?.length || 0} appointments with invalid status\n`);
        
        if (invalidAppointments && invalidAppointments.length > 0) {
            console.log('Invalid appointments:', invalidAppointments);
        }

        // Step 2: Fix "rejected" -> "declined"
        console.log('Step 2: Converting "rejected" to "declined"...');
        
        // Get all appointments to fix them one by one
        const { data: allAppointments, error: getAllError } = await supabase
            .from('appointments')
            .select('*');

        if (getAllError) {
            console.error('Error getting all appointments:', getAllError);
            throw getAllError;
        }

        let fixedCount = 0;
        for (const appt of allAppointments) {
            // Check if status needs normalization
            const statusMap = {
                'rejected': 'declined',
                'approved': 'accepted',
                'approve': 'accepted',
                'reject': 'declined'
            };

            const normalized = statusMap[appt.status?.toLowerCase()];
            
            if (normalized) {
                console.log(`  Fixing appointment ${appt.id}: "${appt.status}" -> "${normalized}"`);
                
                // Update using raw query to bypass enum validation
                const { error: updateError } = await supabase.rpc('execute_sql', {
                    query: `UPDATE appointments SET status = $1 WHERE id = $2`,
                    params: [normalized, appt.id]
                });

                if (updateError) {
                    // Try direct update
                    const { error: directError } = await supabase
                        .from('appointments')
                        .update({ status: normalized })
                        .eq('id', appt.id);
                    
                    if (directError) {
                        console.error(`  Failed to update ${appt.id}:`, directError.message);
                    } else {
                        fixedCount++;
                    }
                } else {
                    fixedCount++;
                }
            }
        }

        console.log(`\n✅ Fixed ${fixedCount} appointments\n`);

        // Step 3: Mark overdue appointments
        console.log('Step 3: Marking overdue appointments...');
        const now = new Date().toISOString();
        
        const { data: overdueAppointments, error: overdueError } = await supabase
            .from('appointments')
            .select('id, appointment_time, duration_minutes, status')
            .lt('appointment_time', now)
            .in('status', ['pending', 'accepted']);

        if (overdueError) {
            console.error('Error finding overdue appointments:', overdueError);
        } else {
            console.log(`Found ${overdueAppointments?.length || 0} overdue appointments`);
            
            // Note: We'll mark them as completed or add a note, but we don't auto-cancel
            // as they might have happened
            for (const appt of overdueAppointments || []) {
                const apptTime = new Date(appt.appointment_time);
                const duration = appt.duration_minutes || 30;
                const endTime = new Date(apptTime.getTime() + duration * 60000);
                
                if (new Date() > endTime) {
                    console.log(`  Appointment ${appt.id} is overdue by ${Math.floor((new Date() - endTime) / 60000)} minutes`);
                }
            }
        }

        // Step 4: Verify final state
        console.log('\nStep 4: Verifying final state...');
        const { data: statusCounts, error: countError } = await supabase
            .from('appointments')
            .select('status');

        if (!countError && statusCounts) {
            const counts = statusCounts.reduce((acc, appt) => {
                acc[appt.status] = (acc[appt.status] || 0) + 1;
                return acc;
            }, {});
            
            console.log('\nAppointment status distribution:');
            Object.entries(counts).forEach(([status, count]) => {
                console.log(`  ${status}: ${count}`);
            });
        }

        console.log('\n✅ Appointment status fix completed successfully!');
        console.log('\n⚠️  Please restart your backend server now.\n');
        
    } catch (error) {
        console.error('\n❌ Error fixing appointment statuses:', error);
        console.error(error.stack);
    }
}

// Run the fix
fixAppointmentStatuses()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error(err);
        process.exit(1);
    });
