const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

dotenv.config({ path: '../../.env' });

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASS || 'kolin123',
  database: process.env.DB_NAME || 'misvord',
  port: parseInt(process.env.DB_PORT) || 1003,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: process.env.DB_CHARSET || 'utf8mb4'
};

let pool = null;

async function initDatabase() {
  try {
    pool = mysql.createPool(dbConfig);
    
    const connection = await pool.getConnection();
    console.log('✅ Database connection established successfully');
    connection.release();
    
    return true;
  } catch (error) {
    console.error('❌ Database connection error:', error.message);
    return false;
  }
}

async function getConnection() {
  if (!pool) {
    await initDatabase();
  }
  
  try {
    return await pool.getConnection();
  } catch (error) {
    console.error('❌ Failed to get database connection:', error.message);
    throw error;
  }
}

async function query(sql, params = []) {
  try {
    const connection = await getConnection();
    const [results] = await connection.execute(sql, params);
    connection.release();
    return results;
  } catch (error) {
    console.error('❌ Database query error:', error.message);
    throw error;
  }
}

module.exports = {
  initDatabase,
  getConnection,
  query,
  dbConfig
}; 