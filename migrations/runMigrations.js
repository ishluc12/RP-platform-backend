const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const fs = require('fs');
const { pgPool, testConnection } = require('../src/config/database');
// const { seedDatabase } = require('../seeds/seedDb'); // Import the main seeder

const migrationsDir = path.join(__dirname);

async function runMigrations() {
    console.log('Starting database migrations...');

    const isConnected = await testConnection();
    if (!isConnected) {
        console.error('❌ Database not connected, aborting migrations.');
        return;
    }

    try {
        // Ensure migration_history table exists
        await pgPool.query(`
            CREATE TABLE IF NOT EXISTS migration_history (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        const appliedMigrationsResult = await pgPool.query('SELECT name FROM migration_history');
        const appliedMigrations = new Set(appliedMigrationsResult.rows.map(row => row.name));

        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql') && !appliedMigrations.has(file))
            .sort();

        if (migrationFiles.length === 0) {
            console.log('No new migrations to apply.');
            return;
        }

        for (const file of migrationFiles) {
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            console.log(`Executing migration: ${file}`);
            await pgPool.query(sql);
            await pgPool.query('INSERT INTO migration_history (name) VALUES ($1)', [file]);
            console.log(`Successfully executed and recorded ${file}`);
        }

        console.log('All new migrations executed successfully!');
    } catch (error) {
        console.error('❌ Database migration or seeding failed:', error);
    } finally {
        await pgPool.end();
    }
}

runMigrations();
