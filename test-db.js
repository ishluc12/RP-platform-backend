const { pool } = require('./src/config/database');

async function testDatabase() {
    try {
        console.log('Testing database connection...');
        
        // Test basic connection
        const client = await pool.connect();
        console.log('✅ Connected to database');
        
        // Check if posts table exists and its structure
        const tableCheck = await client.query(`
            SELECT column_name, data_type, is_nullable, column_default 
            FROM information_schema.columns 
            WHERE table_name = 'posts' 
            ORDER BY ordinal_position;
        `);
        
        console.log('Posts table structure:');
        console.table(tableCheck.rows);
        
        // Check if there are any posts
        const postsCount = await client.query('SELECT COUNT(*) FROM posts');
        console.log(`Total posts: ${postsCount.rows[0].count}`);
        
        // Test a simple select
        const samplePosts = await client.query('SELECT id, content, created_at FROM posts LIMIT 3');
        console.log('Sample posts:');
        console.table(samplePosts.rows);
        
        client.release();
        console.log('✅ Database test completed successfully');
        
    } catch (error) {
        console.error('❌ Database test failed:', error.message);
        console.error('Full error:', error);
    } finally {
        await pool.end();
    }
}

testDatabase();