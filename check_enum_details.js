const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function checkEnumDetails() {
  try {
    // Check the actual enum type definition
    const result = await pool.query(`
      SELECT t.typname, e.enumlabel, e.enumsortorder
      FROM pg_type t 
      JOIN pg_enum e ON t.oid = e.enumtypid  
      WHERE t.typname = 'appointment_status'
      ORDER BY e.enumsortorder;
    `);
    
    console.log('Full appointment_status enum details:');
    result.rows.forEach(row => {
      console.log(`Order ${row.enumsortorder}: ${row.enumlabel}`);
    });
    
    // Also check if there are any constraints or triggers
    const constraints = await pool.query(`
      SELECT conname, contype, consrc
      FROM pg_constraint
      WHERE conrelid = 'appointments'::regclass;
    `);
    
    console.log('\nConstraints on appointments table:');
    constraints.rows.forEach(row => {
      console.log(`${row.conname} (${row.contype}): ${row.consrc || 'N/A'}`);
    });
    
  } catch (error) {
    console.error('Error checking enum:', error.message);
  } finally {
    await pool.end();
  }
}

checkEnumDetails();