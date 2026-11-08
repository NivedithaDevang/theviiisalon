import { Request, Response } from "express";
import { OAuth2Client } from "google-auth-library";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";
import { UserRow } from "../model/authModel.js";
import {AuthRequest} from "../middleware/authMiddleware.js";
import { sendAdminOTP } from "../services/emailService.js";
import { ResultSetHeader } from "mysql2";

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "viii_luxury_secret_2026";

// 1. Google One-Tap / Sign-In for Clients
export const googleLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { credential } = req.body;
    if (!credential) {
      res.status(400).json({ success: false, message: "Missing Google token" });
      return;
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload?.email) {
      res.status(400).json({ success: false, message: "Invalid Google credential payload" });
      return;
    }

    const email = payload.email.toLowerCase();
    const [existing] = await pool.query<UserRow[]>("SELECT * FROM users WHERE email = ?", [email]);

    let userId: number;
    let role = "client";

    if (existing.length === 0) {
      const [insertResult] = await pool.query<ResultSetHeader>(
        "INSERT INTO users (name, email, google_id, avatar, role) VALUES (?, ?, ?, ?, 'client')",
        [payload.name || "Salon Guest", email, payload.sub, payload.picture || ""]
      );
      userId = insertResult.insertId;
    } else {
      userId = existing[0].id;
      role = existing[0].role;
    }

    const token = jwt.sign({ id: userId, role, email }, JWT_SECRET, { expiresIn: "30d" });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 30 * 24 * 60 * 60 * 1000,
    });

    res.json({
      success: true,
      data: { id: userId, name: payload.name, email, avatar: payload.picture, role },
    });
  } catch (error) {
    console.error("Google Auth Error:", error);
    res.status(500).json({ success: false, message: "Google verification failed" });
  }
};

// 2. Admin Login Step 1: Password Check & OTP Generation
export const requestAdminLogin = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    const adminEmail = (process.env.ADMIN_EMAIL || "theviiisalon88@gmail.com").toLowerCase();

    if (email.toLowerCase() !== adminEmail) {
      res.status(401).json({ success: false, message: "Unauthorized email address" });
      return;
    }

    const [rows] = await pool.query<UserRow[]>("SELECT * FROM users WHERE email = ?", [adminEmail]);

    if (rows.length === 0) {
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "TheVIII@2026";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ('Keerthi', ?, ?, 'admin')",
        [adminEmail, hashedPassword]
      );
    } else if (password) {
      const match = await bcrypt.compare(password, rows[0].password || "");
      if (!match) {
        res.status(401).json({ success: false, message: "Invalid admin password" });
        return;
      }
    }

    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(rawOtp).digest("hex");
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

    await pool.query(
      "UPDATE users SET admin_otp_hash = ?, admin_otp_expires = ? WHERE email = ?",
      [otpHash, expires, adminEmail]
    );

    await sendAdminOTP(adminEmail, rawOtp);

    res.json({ success: true, message: "Security OTP sent to the registered salon email." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Failed to dispatch verification code" });
  }
};

// 3. Admin Login Step 2: Verify OTP and Issue Session
export const verifyAdminOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;
    const [rows] = await pool.query<UserRow[]>(
      "SELECT * FROM users WHERE email = ?",
      [email.toLowerCase()]
    );

    if (rows.length === 0 || !rows[0].admin_otp_hash || !rows[0].admin_otp_expires) {
      res.status(400).json({ success: false, message: "No active OTP request found" });
      return;
    }

    const admin = rows[0];
    const otpExpires = admin.admin_otp_expires;
    if (!otpExpires || new Date() > new Date(otpExpires)) {
      res.status(400).json({ success: false, message: "OTP has expired. Request a new one." });
      return;
    }

    const hashedInput = crypto.createHash("sha256").update(String(otp).trim()).digest("hex");
    if (hashedInput !== admin.admin_otp_hash) {
      res.status(401).json({ success: false, message: "Incorrect OTP code." });
      return;
    }

    await pool.query(
      "UPDATE users SET admin_otp_hash = NULL, admin_otp_expires = NULL WHERE id = ?",
      [admin.id]
    );

    const token = jwt.sign({ id: admin.id, role: "admin", email: admin.email }, JWT_SECRET, {
      expiresIn: "12h",
    });

    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { name: admin.name, email: admin.email, role: "admin" } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Verification failed" });
  }
};

export const getMe = async (req: AuthRequest, res: Response): Promise<void> => {
  const [rows] = await pool.query<UserRow[]>(
    "SELECT id, name, email, phone, avatar, role, created_at FROM users WHERE id = ?",
    [req.user?.id]
  );
  if (rows.length === 0) {
    res.status(404).json({ success: false, message: "User not found" });
    return;
  }
  res.json({ success: true, data: rows[0] });
};

export const logout = (_req: Request, res: Response): void => {
  res.clearCookie("token");
  res.json({ success: true, message: "Logged out successfully" });
};