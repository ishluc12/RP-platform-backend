require('dotenv').config();
const Message = require('./src/models/Message');
const { supabaseAdmin } = require('./src/config/database');

async function testMessageQueries() {
    console.log('=== Testing Updated Message Queries ===\n');
    
    try {
        // First, let's get some sample user IDs
        const { data: users, error: usersError } = await supabaseAdmin
            .from('users')
            .select('id, name, email')
            .limit(3);
            
        if (usersError) {
            console.error('Error fetching users:', usersError);
            return;
        }
        
        console.log('Sample users:', users.map(u => ({ id: u.id, name: u.name })));
        
        if (users.length < 2) {
            console.log('Need at least 2 users to test direct messages');
            return;
        }
        
        const user1 = users[0];
        const user2 = users[1];
        
        console.log(`\n=== Testing Direct Thread: ${user1.name} <-> ${user2.name} ===`);
        
        // Test getDirectThread with enriched user data
        const directResult = await Message.getDirectThread(user1.id, user2.id, { page: 1, limit: 5 });
        
        if (directResult.success) {
            console.log('Direct thread messages:', directResult.data.length);
            if (directResult.data.length > 0) {
                console.log('Sample message with user data:');
                const sampleMessage = directResult.data[0];
                console.log({
                    id: sampleMessage.id,
                    message: sampleMessage.message,
                    sender_id: sampleMessage.sender_id,
                    sender_name: sampleMessage.sender_name,
                    sender_profile_picture: sampleMessage.sender_profile_picture,
                    sent_at: sampleMessage.sent_at
                });
            }
        } else {
            console.log('Direct thread error:', directResult.error);
        }
        
        // Test group messages if there are any groups
        const { data: groups } = await supabaseAdmin
            .from('chat_groups')
            .select('id, name')
            .limit(1);
            
        if (groups && groups.length > 0) {
            const group = groups[0];
            console.log(`\n=== Testing Group Messages: ${group.name} ===`);
            
            const groupResult = await Message.getGroupMessages(group.id, { page: 1, limit: 5 });
            
            if (groupResult.success) {
                console.log('Group messages:', groupResult.data.length);
                if (groupResult.data.length > 0) {
                    console.log('Sample group message with user data:');
                    const sampleGroupMessage = groupResult.data[0];
                    console.log({
                        id: sampleGroupMessage.id,
                        message: sampleGroupMessage.message,
                        sender_id: sampleGroupMessage.sender_id,
                        sender_name: sampleGroupMessage.sender_name,
                        sender_profile_picture: sampleGroupMessage.sender_profile_picture,
                        sent_at: sampleGroupMessage.sent_at
                    });
                }
            } else {
                console.log('Group messages error:', groupResult.error);
            }
        } else {
            console.log('\n=== No groups found to test ===');
        }
        
    } catch (error) {
        console.error('Test error:', error);
    }
}

testMessageQueries();