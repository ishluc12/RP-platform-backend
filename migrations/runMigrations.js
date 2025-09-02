const fs = require('fs');
const path = require('path');
const { pgPool, testConnection } = require('../src/config/database');

async function runMigrations() {
    console.log('Starting database migrations...');

    const isConnected = await testConnection();
    if (!isConnected) {
        console.error('Migration failed: Database not connected.');
        process.exit(1);
    }

    const migrationsDir = path.join(__dirname);
    const migrationFiles = fs.readdirSync(migrationsDir).filter(file => file.endsWith('.sql')).sort();

    if (migrationFiles.length === 0) {
        console.log('No migration files found.');
        return;
    }

    const client = await pgPool.connect();
    try {
        for (const file of migrationFiles) {
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            console.log(`Executing migration: ${file}`);

            await client.query(sql);
            console.log(`Successfully executed ${file}`);
        }
    } catch (error) {
        console.error(`❌ Error executing migration:`, error.message);
        process.exit(1);
    } finally {
        client.release();
    }

    console.log('All migrations executed successfully!');
}

runMigrations();
