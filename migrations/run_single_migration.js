const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const fs = require('fs');
const { pgPool, testConnection } = require('../src/config/database');

const migrationToRun = '019_fix_posts_rls.sql';

async function runSingleMigration() {
    console.log(`Attempting to run single migration: ${migrationToRun}`);

    const isConnected = await testConnection();
    if (!isConnected) {
        console.error('❌ Database not connected, aborting migration.');
        return;
    }

    const client = await pgPool.connect();
    try {
        const migrationFile = path.join(__dirname, migrationToRun);
        if (!fs.existsSync(migrationFile)) {
            console.error(`Migration file not found: ${migrationFile}`);
            return;
        }

        const appliedMigrationsResult = await client.query('SELECT name FROM migration_history WHERE name = $1', [migrationToRun]);
        if (appliedMigrationsResult.rowCount > 0) {
            console.log(`Migration ${migrationToRun} has already been applied.`);
            return;
        }

        await client.query('BEGIN');

        const sql = fs.readFileSync(migrationFile, 'utf8');
        console.log(`Executing migration: ${migrationToRun}`);
        await client.query(sql);

        await client.query('INSERT INTO migration_history (name) VALUES ($1)', [migrationToRun]);
        console.log(`Successfully executed and recorded ${migrationToRun}`);

        await client.query('COMMIT');
        console.log('Migration completed successfully.');

    } catch (error) {
        await client.query('ROLLBACK');
        console.error('❌ Migration failed:', error);
    } finally {
        client.release();
        await pgPool.end();
    }
}

runSingleMigration();
