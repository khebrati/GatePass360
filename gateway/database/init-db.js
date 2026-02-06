const fs = require('fs');
const path = require('path');
const pool = require('./db');

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

async function initializeDatabase() {
  const client = await pool.connect();
  try {
    // Test database connection
    await client.query('SELECT NOW()');
    console.log('Database connected successfully.');

    // Set search path to the user's schema
    await client.query('SET search_path TO erfankhebrati, public');

    // Initialize schema
    console.log('Initializing database schema...');
    await client.query(schema);
    console.log('Database schema initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  } finally {
    client.release();
  }
}

module.exports = { initializeDatabase };
