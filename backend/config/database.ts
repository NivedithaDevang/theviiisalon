import mysql from "mysql2/promise";
import { database } from "./env.js";

export const db = mysql.createPool(database);

export async function connectDB(): Promise<void> {
  const connection = await db.getConnection();
  console.log("Database connection established");
  connection.release();
}