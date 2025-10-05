const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const { pgPool, testConnection } = require('../src/config/database');

async function insertMigrationHistory() {
    console.log('Starting to insert migration history...');

    const isConnected = await testConnection();
    if (!isConnected) {
        console.error('❌ Database not connected, aborting.');
        return;
    }

    try {
        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS migration_history (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const migrationsToInsert = [
            '001_create_users_table.sql',
            '002_create_events_table.sql',
            '003_create_all_tables.sql',
            '004_create_get_user_conversations_function.sql',
            '005_create_get_event_stats_function.sql',
            '006_create_events_with_stats_view.sql',
            '007_create_all_tables_with_uuid.sql',
            '008_add_target_audience_to_events.sql',
            '009_add_source_to_notifications.sql',
            '010_add_week_of_month_to_staff_availability.sql',
            '011_fix_chat_groups_and_messages.sql',
            '012_add_approved_to_appointment_status.sql',
            '013_fix_notification_trigger_status.sql'
        ];

        for (const migrationName of migrationsToInsert) {
            try {
                await pgPool.query('INSERT INTO migration_history (name) VALUES ($1) ON CONFLICT (name) DO NOTHING', [migrationName]);
                console.log(`Inserted/Skipped ${migrationName}`);
            } catch (error) {
                console.error(`Error inserting ${migrationName}:`, error);
            }
        }

        console.log('Migration history insertion complete.');
    } catch (error) {
        console.error('❌ Failed to insert migration history:', error);
    } finally {
        await pgPool.end();
    }
}

insertMigrationHistory();

