const mysql = require("mysql2");
require("dotenv").config({ path: "../.env" }); // Go up 2 levels to load .env

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0,
    connectTimeout: 30000,  // 30 seconds timeout
    enableKeepAlive: true,   // Keep connection alive
    keepAliveInitialDelay: 10000  // 10 seconds
  }).promise(); // Use promise-based API


// `pool.promise()` returns a version of the pool that supports Promises
module.exports = pool;
