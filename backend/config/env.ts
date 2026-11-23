import dotenv from "dotenv";
dotenv.config();

export const database = {
  get host() { return process.env.DB_HOST; },
  get user() { return process.env.DB_USER; },
  get password() { return process.env.DB_PASSWORD; },
  get database() { return process.env.DB_NAME; },
  get port() { return Number(process.env.DB_PORT) || 3306; },
};

export const SERVER_PORT = process.env.PORT;
export const JWT_SECRET = process.env.JWT_SECRET!;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const DB_HOST = process.env.DB_HOST!;
export const DB_USER = process.env.DB_USER!;
export const DB_NAME = process.env.DB_NAME!;
export const REACTURL = process.env.REACT_URL;

