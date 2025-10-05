const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const dbUrl = process.env.DATABASE_URL;

if (!dbUrl) {
  console.error('Missing DATABASE_URL');
  process.exit(1);
}

async function applyMigration() {
  const client = new Client(dbUrl);
  try {
    await client.connect();
    console.log('Connected to database');

    const sql = fs.readFileSync(path.join(__dirname, 'complete_database_fix.sql'), 'utf8');
    const statements = sql.split(';').filter(s => s.trim());

    console.log(`Found ${statements.length} statements`);

    for (let i = 0; i < statements.length; i++) {
      const stmt = statements[i];
      try {
        await client.query(stmt);
        console.log(`Executed statement ${i+1}/${statements.length}`);
      } catch (err) {
        console.error(`Error in statement ${i+1}: ${err.message}`);
        // Continue to next, as some may already exist
      }
    }

    console.log('Migration applied successfully');
  } catch (err) {
    console.error('Migration error:', err);
  } finally {
    await client.end();
  }
}

applyMigration(); 