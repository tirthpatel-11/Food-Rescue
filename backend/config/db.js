const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
require('dotenv').config({ path: path.resolve(process.cwd(), '.env') });

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT, 10) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'food_rescue',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  decimalNumbers: true,
  dateStrings: true
});

// Helper to check DB connection on server startup
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log(' Successfully connected to MySQL database: ' + (process.env.DB_NAME || 'food_rescue'));
    connection.release();
    return true;
  } catch (error) {
    console.error(' Database connection failed:', error.message);
    console.error(' Please ensure MySQL is running and DB credentials in .env are correct.');
    return false;
  }
}

module.exports = {
  pool,
  testConnection
};
