import crypto from "crypto";
import bcrypt from "bcryptjs";
import {db} from "../config/database.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export interface AdminUser extends RowDataPacket {
  id: number;
  email: string;
  password_hash: string;
  role: "ADMIN";
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export const authModel = {
  async ensureDefaultAdmin(): Promise<void> {
    const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
    const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD;
    if (!email || !defaultPassword) {
      console.warn("Please enter admin email and password");
      return;
    }

    const [admins] = await db.query<RowDataPacket[]>(
      "SELECT id FROM admins LIMIT 1"
    );
    if (admins.length > 0) return;

    const passwordHash = await bcrypt.hash(defaultPassword, 12);
    await this.createAdmin(email, passwordHash);
    console.info("Admin account created succesfully");
  },

  // Timing-safe check for the salon admin secret key
  verifySecretKey(providedKey: string): boolean {
    const expectedKey = process.env.ADMIN_SECRET_KEY;
    if (!expectedKey || !providedKey) return false;

    const providedBuf = Buffer.from(providedKey.trim());
    const expectedBuf = Buffer.from(expectedKey.trim());

    if (providedBuf.length !== expectedBuf.length) return false;
    return crypto.timingSafeEqual(providedBuf, expectedBuf);
  },

  // Find active or inactive admin by email (used during login)
  async findByEmail(email: string): Promise<AdminUser | null> {
    const [rows] = await db.query<AdminUser[]>(
      `SELECT id, email, password_hash, role, is_active, created_at, updated_at
       FROM admins
       WHERE LOWER(email) = LOWER(?)
       LIMIT 1`,
      [email.trim()]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // Find admin by ID without exposing password_hash (used for JWT/session middleware)
  async findById(id: number): Promise<Omit<AdminUser, "password_hash"> | null> {
    const [rows] = await db.query<AdminUser[]>(
      `SELECT id, email, role, is_active, created_at, updated_at
       FROM admins
       WHERE id = ?
       LIMIT 1`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // Create a new admin account
  async createAdmin(
    email: string,
    passwordHash: string,
    role: "ADMIN" = "ADMIN"
  ): Promise<number> {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO admins (email, password_hash, role)
       VALUES (?, ?, ?)`,
      [email.trim().toLowerCase(), passwordHash, role]
    );
    return result.insertId;
  },

};