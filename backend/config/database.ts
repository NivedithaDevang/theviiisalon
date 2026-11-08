import mysql from "mysql2/promise";
import dotenv from "dotenv";

dotenv.config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "viii_salon",
  port: Number(process.env.DB_PORT || 3306),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export const connectDB = async (): Promise<void> => {
  try {
    const connection = await pool.getConnection();
    console.log("MySQL Connection Pool successfully initialized.");
    connection.release();
  } catch (error) {
    console.error("MySQL Connection Failed:", error);
    process.exit(1);
  }
};