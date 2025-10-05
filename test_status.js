const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

async function testStatusUpdate() {
    try {
        // First, let's check what enum values are actually in the database
        const { data: enumData, error: enumError } = await supabase
            .rpc('pg_enum', {})
            .select('enumlabel')
            .eq('enumtypid', 
                (await supabase.rpc('pg_type', {}).select('oid').eq('typname', 'appointment_status').single()).data.oid
            );
        
        console.log('Current enum values:', enumData);
        
        // Now let's try to update an appointment with 'accepted'
        const { data: updateData, error: updateError } = await supabase
            .from('appointments')
            .update({ status: 'accepted' })
            .eq('id', '32e929b6-bb36-4dee-a70d-427040b7cc40')
            .select('*')
            .single();
        
        console.log('Update result:', { updateData, updateError });
        
    } catch (error) {
        console.error('Test failed:', error.message);
    }
}

testStatusUpdate();