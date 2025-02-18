import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const db = createPool({
  host: 'shortline.proxy.rlwy.net',
  user: 'root',
  password: process.env.RAILWAY_MYSQL_ROOT_PASSWORD,
  database: 'railway',
  port: 26786,
  ssl: {
    rejectUnauthorized: false,
  },
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

// Test the connection
db.getConnection()
  .then(connection => {
    console.log('Successfully connected to Railway MySQL database');
    connection.release();
  })
  .catch(err => {
    console.error('Error connecting to Railway database:', err);
  });

export default db;
