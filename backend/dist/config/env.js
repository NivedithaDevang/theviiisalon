import dotenv from "dotenv";
dotenv.config();
export const database = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: Number(process.env.DB_PORT),
};
export const SERVER_PORT = process.env.PORT;
export const JWT_SECRET = process.env.JWT_SECRET;
export const NODE_ENV = process.env.NODE_ENV || "development";
export const DB_HOST = process.env.DB_HOST;
export const DB_USER = process.env.DB_USER;
export const DB_NAME = process.env.DB_NAME;
export const REACTURL = process.env.REACT_URL;
//# sourceMappingURL=env.js.map