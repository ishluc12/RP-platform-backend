require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function debugEnum() {
  try {
    // Query to get enum values from the database
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, udt_name')
      .eq('table_name', 'appointments')
      .eq('column_name', 'appointment_status');

    if (error) {
      console.error('Error querying enum:', error);
      return;
    }

    console.log('Column info:', data);

    // Query enum values
    const { data: enumData, error: enumError } = await supabase
      .from('pg_enum')
      .select('enumlabel')
      .order('enumsortorder');

    if (enumError) {
      console.error('Error querying enum values:', enumError);
      return;
    }

    console.log('All enum values:', enumData);

    // Try to update an appointment with 'accepted'
    const { data: updateData, error: updateError } = await supabase
      .from('appointments')
      .update({ appointment_status: 'accepted' })
      .eq('id', '32e929b6-bb36-4dee-a70d-427040b7cc40')
      .select();

    if (updateError) {
      console.error('Update error:', updateError);
    } else {
      console.log('Update successful:', updateData);
    }

  } catch (error) {
    console.error('Error:', error);
  }
}

debugEnum();