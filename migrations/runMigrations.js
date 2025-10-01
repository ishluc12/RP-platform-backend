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
        // Get all migration files, sort them to ensure order
        const migrationFiles = fs.readdirSync(migrationsDir)
            .filter(file => file.endsWith('.sql'))
            .sort(); // Sort alphabetically to ensure order

        for (const file of migrationFiles) {
            const filePath = path.join(migrationsDir, file);
            const sql = fs.readFileSync(filePath, 'utf8');
            console.log(`Executing migration: ${file}`);
            await pgPool.query(sql);
            console.log(`Successfully executed ${file}`);
        }

        console.log('All migrations executed successfully!');

        // After migrations, run the seeding script
        // await seedDatabase();

    } catch (error) {
        console.error('❌ Database migration or seeding failed:', error);
    } finally {
        await pgPool.end();
    }
}

runMigrations();
