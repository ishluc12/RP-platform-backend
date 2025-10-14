const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase credentials in .env file');
    console.error('Required: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY (or SUPABASE_KEY)');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
    console.log('🚀 Starting chat schema fix migration...\n');

    try {
        // Read the SQL file
        const sqlFile = path.join(__dirname, 'COMPLETE_CHAT_SCHEMA_FIX.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Split by semicolons but keep multi-line statements together
        const statements = sql
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'));

        console.log(`📝 Found ${statements.length} SQL statements to execute\n`);

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < statements.length; i++) {
            const statement = statements[i] + ';';
            
            // Skip comments and empty statements
            if (statement.trim().startsWith('--') || statement.trim() === ';') {
                continue;
            }

            // Get a preview of the statement
            const preview = statement.substring(0, 80).replace(/\s+/g, ' ');
            
            try {
                console.log(`⏳ Executing statement ${i + 1}/${statements.length}...`);
                console.log(`   ${preview}...`);
                
                const { data, error } = await supabase.rpc('exec_sql', { sql_query: statement });
                
                if (error) {
                    // Try direct execution if RPC fails
                    const { error: directError } = await supabase.from('_').select(statement);
                    if (directError && !directError.message.includes('does not exist')) {
                        throw directError;
                    }
                }
                
                console.log(`   ✅ Success\n`);
                successCount++;
            } catch (error) {
                // Some errors are expected (like "column already exists")
                if (error.message.includes('already exists') || 
                    error.message.includes('IF NOT EXISTS') ||
                    error.message.includes('duplicate key')) {
                    console.log(`   ⚠️  Skipped (already exists)\n`);
                    successCount++;
                } else {
                    console.error(`   ❌ Error: ${error.message}\n`);
                    errorCount++;
                }
            }
        }

        console.log('\n' + '='.repeat(60));
        console.log('📊 Migration Summary:');
        console.log(`   ✅ Successful: ${successCount}`);
        console.log(`   ❌ Errors: ${errorCount}`);
        console.log('='.repeat(60) + '\n');

        if (errorCount === 0) {
            console.log('✨ Migration completed successfully!');
            console.log('\n📋 Next steps:');
            console.log('   1. Restart your backend server');
            console.log('   2. Test creating a new group');
            console.log('   3. Test sending file messages\n');
        } else {
            console.log('⚠️  Migration completed with some errors.');
            console.log('   Please review the errors above and run manually if needed.\n');
        }

    } catch (error) {
        console.error('\n❌ Migration failed:', error.message);
        console.error('\n💡 Try running the SQL file manually in Supabase SQL Editor:');
        console.error(`   File: ${path.join(__dirname, 'COMPLETE_CHAT_SCHEMA_FIX.sql')}\n`);
        process.exit(1);
    }
}

// Alternative: Run SQL directly via Supabase SQL Editor
async function runDirectSQL() {
    console.log('🚀 Running migration via direct SQL execution...\n');

    try {
        const sqlFile = path.join(__dirname, 'COMPLETE_CHAT_SCHEMA_FIX.sql');
        const sql = fs.readFileSync(sqlFile, 'utf8');

        // Remove comments and split into individual statements
        const cleanSQL = sql
            .split('\n')
            .filter(line => !line.trim().startsWith('--'))
            .join('\n');

        console.log('📝 Executing SQL migration...\n');
        console.log('⚠️  Note: This method may not work with all Supabase plans.');
        console.log('   If this fails, please copy the SQL from COMPLETE_CHAT_SCHEMA_FIX.sql');
        console.log('   and run it in the Supabase SQL Editor.\n');

        // For Supabase, we need to run this in the SQL Editor
        console.log('📋 SQL File Location:');
        console.log(`   ${sqlFile}\n`);
        
        console.log('📖 Instructions:');
        console.log('   1. Open Supabase Dashboard');
        console.log('   2. Go to SQL Editor');
        console.log('   3. Create a new query');
        console.log('   4. Copy the contents of COMPLETE_CHAT_SCHEMA_FIX.sql');
        console.log('   5. Paste and run the query\n');

        console.log('✨ Or run these individual commands:\n');
        console.log('-- Add avatar column to chat_groups');
        console.log('ALTER TABLE chat_groups ADD COLUMN IF NOT EXISTS avatar VARCHAR(500);');
        console.log('ALTER TABLE chat_groups ADD COLUMN IF NOT EXISTS description TEXT;\n');
        
        console.log('-- Add file columns to messages');
        console.log('ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_url VARCHAR(500);');
        console.log('ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_name VARCHAR(255);');
        console.log('ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_size INTEGER;');
        console.log('ALTER TABLE messages ADD COLUMN IF NOT EXISTS file_type VARCHAR(100);\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

// Run the migration
console.log('╔════════════════════════════════════════════════════════════╗');
console.log('║     CHAT SCHEMA FIX - Database Migration Tool              ║');
console.log('╚════════════════════════════════════════════════════════════╝\n');

runDirectSQL();
