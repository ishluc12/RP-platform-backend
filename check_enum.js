const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkEnum() {
  try {
    const result = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (SELECT oid FROM pg_type WHERE typname = 'appointment_status')
      ORDER BY enumsortorder;
    `);
    console.log('Current appointment_status enum values:');
    result.rows.forEach(row => console.log('-', row.enumlabel));
  } catch (error) {
    console.error('Error checking enum:', error.message);
  } finally {
    await pool.end();
  }
}

checkEnum();