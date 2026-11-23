import mysql, { Pool } from "mysql2/promise";
import { database } from "./env.js";

let pool: Pool | null = null;

export function getPool(): Pool {
  if (!pool) {
    pool = mysql.createPool({
      host: database.host,
      user: database.user,
      password: database.password,
      database: database.database,
      port: database.port,
    });
  }
  return pool;
}

export const db: Pool = new Proxy({} as Pool, {
  get(_target, prop) {
    const activePool = getPool();
    const value = (activePool as any)[prop];
    return typeof value === "function" ? value.bind(activePool) : value;
  },
});

export async function connectDB(): Promise<void> {
  const connection = await db.getConnection();
  console.log("Database connection established");
  connection.release();
}
