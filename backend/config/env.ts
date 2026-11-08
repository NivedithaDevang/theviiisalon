
import dotenv from "dotenv";

dotenv.config();

const requiredEnv = ["JWT_SECRET", "DB_HOST", "DB_USER", "DB_NAME"];

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing environment variable: ${key}`);
  }
}

export const JWT_SECRET = process.env.JWT_SECRET!;
export const PORT = Number(process.env.PORT) || 5000;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const DB_HOST = process.env.DB_HOST!;
export const DB_USER = process.env.DB_USER!;
export const DB_NAME = process.env.DB_NAME!;