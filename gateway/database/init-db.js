const fs = require('fs');
const path = require('path');
const pool = require('./db');

const schemaPath = path.join(__dirname, 'schema.sql');
const schema = fs.readFileSync(schemaPath, 'utf8');

async function initializeDatabase() {
  try {
    // Test database connection
    await pool.query('SELECT NOW()');
    console.log('Database connected successfully.');

    // Initialize schema
    console.log('Initializing database schema...');
    await pool.query(schema);
    console.log('Database schema initialized successfully.');
  } catch (err) {
    console.error('Error initializing database:', err);
    throw err;
  }
}

module.exports = { initializeDatabase };
