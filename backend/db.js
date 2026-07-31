import mysql from "mysql2/promise";
import "dotenv/config";

// Connection pool — lebih efisien daripada buka/tutup koneksi tiap request
export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "root",
  database: process.env.DB_NAME || "mcis_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});
