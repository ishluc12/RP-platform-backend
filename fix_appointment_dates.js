#!/usr/bin/env node

/**
 * Fix Appointment Date Issues
 * This script ensures all appointments and availability slots have correct dates
 */

const { supabase } = require('./src/config/database');

async function fixAppointmentDates() {
    console.log('🔧 Starting appointment date fix...\n');
    
    try {
        // 1. Clean up past availability slots
        console.log('1️⃣ Cleaning up past availability slots...');
        const today = new Date().toISOString().split('T')[0];
        
        const { data: pastSlots, error: pastError } = await supabase
            .from('staff_availability')
            .delete()
            .lt('specific_date', today)
            .not('specific_date', 'is', null)
            .select();

        if (pastError) {
            console.error('❌ Error cleaning past slots:', pastError);
        } else {
            console.log(`✅ Deleted ${pastSlots?.length || 0} past availability slots`);
        }

        // 2. Fix appointments with incorrect dates
        console.log('\n2️⃣ Checking appointment dates...');
        const { data: appointments, error: apptError } = await supabase
            .from('appointments')
            .select('*')
            .gte('appointment_date', today);

        if (apptError) {
            console.error('❌ Error fetching appointments:', apptError);
        } else {
            console.log(`📊 Found ${appointments?.length || 0} future appointments`);
            
            let fixedCount = 0;
            for (const appointment of appointments || []) {
                // Ensure appointment_date is in YYYY-MM-DD format
                const appointmentDate = new Date(appointment.appointment_date);
                const correctDateStr = appointmentDate.toISOString().split('T')[0];
                
                if (appointment.appointment_date !== correctDateStr) {
                    const { error: updateError } = await supabase
                        .from('appointments')
                        .update({ appointment_date: correctDateStr })
                        .eq('id', appointment.id);
                    
                    if (updateError) {
                        console.error(`❌ Error fixing appointment ${appointment.id}:`, updateError);
                    } else {
                        fixedCount++;
                    }
                }
            }
            console.log(`✅ Fixed ${fixedCount} appointment dates`);
        }

        // 3. Ensure availability slots have proper specific_date format
        console.log('\n3️⃣ Checking availability slot dates...');
        const { data: slots, error: slotsError } = await supabase
            .from('staff_availability')
            .select('*')
            .not('specific_date', 'is', null)
            .gte('specific_date', today);

        if (slotsError) {
            console.error('❌ Error fetching availability slots:', slotsError);
        } else {
            console.log(`📊 Found ${slots?.length || 0} future availability slots`);
            
            let fixedSlotCount = 0;
            for (const slot of slots || []) {
                // Ensure specific_date is in YYYY-MM-DD format
                const slotDate = new Date(slot.specific_date);
                const correctDateStr = slotDate.toISOString().split('T')[0];
                
                if (slot.specific_date !== correctDateStr) {
                    const { error: updateError } = await supabase
                        .from('staff_availability')
                        .update({ specific_date: correctDateStr })
                        .eq('id', slot.id);
                    
                    if (updateError) {
                        console.error(`❌ Error fixing slot ${slot.id}:`, updateError);
                    } else {
                        fixedSlotCount++;
                    }
                }
            }
            console.log(`✅ Fixed ${fixedSlotCount} availability slot dates`);
        }

        console.log('\n🎉 Date fix completed successfully!');
        console.log('\n📋 Summary:');
        console.log(`   • Cleaned up past availability slots`);
        console.log(`   • Fixed appointment date formats`);
        console.log(`   • Fixed availability slot date formats`);
        console.log('\n💡 Next steps:');
        console.log('   1. Restart your backend server');
        console.log('   2. Test appointment booking with specific dates');
        console.log('   3. Verify slots appear on correct days');

    } catch (error) {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    }
}

// Run the fix
if (require.main === module) {
    fixAppointmentDates().catch(error => {
        console.error('💥 Fatal error:', error);
        process.exit(1);
    });
}

module.exports = fixAppointmentDates;