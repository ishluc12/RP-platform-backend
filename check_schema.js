require('dotenv').config();
const { supabaseAdmin } = require('./src/config/database');

async function checkSchema() {
    console.log('=== CHECKING DATABASE SCHEMA ===\n');
    
    const tables = ['users', 'messages', 'chat_groups', 'chat_group_members'];
    
    for (const table of tables) {
        console.log(`=== ${table.toUpperCase()} TABLE ===`);
        try {
            const { data, error } = await supabaseAdmin.from(table).select('*').limit(1);
            
            if (error) {
                console.log('Error:', error.message);
            } else if (data && data.length > 0) {
                console.log('Columns:', Object.keys(data[0]).join(', '));
                console.log('Sample data:', JSON.stringify(data[0], null, 2));
            } else {
                console.log('Table exists but is empty');
            }
        } catch (err) {
            console.log('Table might not exist:', err.message);
        }
        console.log('');
    }

    // Check for recent messages with user data
    console.log('=== SAMPLE MESSAGES WITH USERS ===');
    try {
        const { data: messages, error } = await supabaseAdmin
            .from('messages')
            .select(`
                *,
                sender:users!messages_sender_id_fkey(id, name, email, profile_picture),
                recipient:users!messages_recipient_id_fkey(id, name, email, profile_picture)
            `)
            .limit(3)
            .order('created_at', { ascending: false });
            
        if (error) {
            console.log('Error fetching messages with user data:', error.message);
        } else {
            console.log('Messages with user data:', JSON.stringify(messages, null, 2));
        }
    } catch (err) {
        console.log('Error:', err.message);
    }
}

checkSchema();