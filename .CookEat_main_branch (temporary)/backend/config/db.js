const { Pool } = require('pg'); // Import Pool from the pg package
require('dotenv').config({ path: '../.env' }); // Go up 2 levels to load .env

// Set up a PostgreSQL connection pool
const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT,
  max: 5, // Max number of connections in the pool
  idleTimeoutMillis: 30000, // 30 seconds idle timeout
  connectionTimeoutMillis: 10000, // 10 seconds timeout for connecting
});


/*
async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    //console.log('Database connected:', result.rows[0].now);
  } catch (err) {
    console.error('Error connecting to the database:', err.message);
  }
}
testConnection();
*/

// Export the pool to be used in other parts of the application
module.exports = pool;

