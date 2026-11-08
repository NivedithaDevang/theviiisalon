import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { pool } from "./config/database.js";
import { sendAdminOTP, sendBookingEmail } from "./services/emailService.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

const app = express();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "viii_luxury_secret_2026";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "theviiisalon88@gmail.com").toLowerCase();

// Middlewares
app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Auth Helper Middlewares
export interface AuthRequest extends Request {
  user?: { id: number; role: "client" | "admin"; email: string; name: string };
}

const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    res.status(401).json({ success: false, message: "Authentication required" });
    return;
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
    const [rows] = await pool.query<RowDataPacket[]>(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [decoded.id]
    );
    if (rows.length === 0) {
      res.status(401).json({ success: false, message: "Session invalid" });
      return;
    }
    req.user = rows[0] as any;
    next();
  } catch {
    res.status(401).json({ success: false, message: "Session expired or invalid" });
  }
};

const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  if (req.user?.role !== "admin") {
    res.status(403).json({ success: false, message: "Restricted to salon management" });
    return;
  }
  next();
};

/* ============================================================
   1. AUTHENTICATION (Google Client Login & Admin 2FA OTP)
============================================================ */

// Google One-Tap / Button Login for Clients
app.post("/api/auth/google", async (req: Request, res: Response) => {
  try {
    const { credential } = req.body;
    if (!credential) return res.status(400).json({ success: false, message: "Missing credential token" });

    const ticket = await googleClient.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) return res.status(400).json({ success: false, message: "Invalid Google payload" });

    const email = payload.email.toLowerCase();
    const [existing] = await pool.query<RowDataPacket[]>("SELECT * FROM users WHERE email = ?", [email]);

    let userId: number;
    let role = "client";

    if (existing.length === 0) {
      const [insert] = await pool.query<ResultSetHeader>(
        "INSERT INTO users (name, email, google_id, avatar, role) VALUES (?, ?, ?, ?, 'client')",
        [payload.name || "Client Guest", email, payload.sub, payload.picture || ""]
      );
      userId = insert.insertId;
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

    res.json({ success: true, data: { id: userId, name: payload.name, email, avatar: payload.picture, role } });
  } catch (err) {
    res.status(500).json({ success: false, message: "Google verification failed" });
  }
});

// Admin Login Step 1: Password Verification & Dispatches OTP
app.post("/api/admin/login-request", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (email?.toLowerCase() !== ADMIN_EMAIL) {
      return res.status(401).json({ success: false, message: "Unauthorized admin email" });
    }

    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM users WHERE email = ?", [ADMIN_EMAIL]);

    if (rows.length === 0) {
      const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD || "TheVIII@2026";
      const hashedPassword = await bcrypt.hash(defaultPassword, 10);
      await pool.query(
        "INSERT INTO users (name, email, password, role) VALUES ('Keerthi', ?, ?, 'admin')",
        [ADMIN_EMAIL, hashedPassword]
      );
    } else if (password) {
      const match = await bcrypt.compare(password, rows[0].password || "");
      if (!match) return res.status(401).json({ success: false, message: "Invalid admin password" });
    }

    // Generate 6-digit numeric OTP
    const rawOtp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpHash = crypto.createHash("sha256").update(rawOtp).digest("hex");
    const expires = new Date(Date.now() + 5 * 60 * 1000); // 5 mins

    await pool.query(
      "UPDATE users SET admin_otp_hash = ?, admin_otp_expires = ? WHERE email = ?",
      [otpHash, expires, ADMIN_EMAIL]
    );

    await sendAdminOTP(ADMIN_EMAIL, rawOtp);
    res.json({ success: true, message: "Verification OTP dispatched to registered salon email" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Error requesting security code" });
  }
});

// Admin Login Step 2: Validate OTP & Unlock Admin Session
app.post("/api/admin/verify-otp", async (req: Request, res: Response) => {
  try {
    const { email, otp } = req.body;
    const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);

    if (rows.length === 0 || !rows[0].admin_otp_hash || !rows[0].admin_otp_expires) {
      return res.status(400).json({ success: false, message: "OTP not requested or expired" });
    }

    const admin = rows[0];
    if (new Date() > new Date(admin.admin_otp_expires)) {
      return res.status(400).json({ success: false, message: "OTP expired. Request a new one." });
    }

    const hashedInput = crypto.createHash("sha256").update(String(otp).trim()).digest("hex");
    if (hashedInput !== admin.admin_otp_hash) {
      return res.status(401).json({ success: false, message: "Invalid OTP code" });
    }

    await pool.query("UPDATE users SET admin_otp_hash = NULL, admin_otp_expires = NULL WHERE id = ?", [admin.id]);

    const token = jwt.sign({ id: admin.id, role: "admin", email: admin.email }, JWT_SECRET, { expiresIn: "12h" });
    res.cookie("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 12 * 60 * 60 * 1000,
    });

    res.json({ success: true, data: { name: admin.name, email: admin.email, role: "admin" } });
  } catch {
    res.status(500).json({ success: false, message: "Verification failed" });
  }
});

// Current Authenticated User Session
app.get("/api/auth/me", authenticate, (req: AuthRequest, res: Response) => {
  res.json({ success: true, data: req.user });
});

app.post("/api/auth/logout", (_req: Request, res: Response) => {
  res.clearCookie("token");
  res.json({ success: true, message: "Signed out successfully" });
});

/* ============================================================
   2. BOOKINGS (Saves direct service name & phone from frontend)
============================================================ */

// Public / Client Booking Reservation
app.post("/api/bookings", async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, email, serviceName, date, time, notes, price } = req.body;

    if (!name?.trim() || !phone?.trim() || !serviceName || !date || !time) {
      return res.status(400).json({ success: false, message: "Please fill all required booking fields" });
    }

    // Check slot collision
    const [conflict] = await pool.query<RowDataPacket[]>(
      "SELECT id FROM bookings WHERE booking_date = ? AND booking_time = ? AND status IN ('PENDING', 'CONFIRMED')",
      [date, time]
    );

    if (conflict.length > 0) {
      return res.status(409).json({ success: false, message: "This slot is already reserved. Please choose another time." });
    }

    // Identify if user is signed in via optional cookie
    let userId: number | null = null;
    const token = req.cookies?.token;
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as { id: number };
        userId = decoded.id;
      } catch {}
    }

    const reference = `VIII-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const cleanPrice = Number(String(price || "0").replace(/[^0-9]/g, "")) || 0;

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO bookings 
        (reference, user_id, name, phone, email, service_name, booking_date, booking_time, notes, bill_amount, status) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`,
      [reference, userId, name.trim(), phone.trim(), email || null, serviceName, date, time, notes || "", cleanPrice]
    );

    if (email) {
      sendBookingEmail(email, { reference, name, date, time, serviceName });
    }

    res.status(201).json({
      success: true,
      data: { id: result.insertId, reference, name, serviceName, date, time, billAmount: cleanPrice },
    });
  } catch (err) {
    console.error("Booking error:", err);
    res.status(500).json({ success: false, message: "Failed to process booking" });
  }
});

// Client's Past & Upcoming Bookings (My Account)
app.get("/api/bookings/my-bookings", authenticate, async (req: AuthRequest, res: Response) => {
  const [rows] = await pool.query<RowDataPacket[]>(
    "SELECT * FROM bookings WHERE user_id = ? OR email = ? ORDER BY id DESC",
    [req.user?.id, req.user?.email]
  );
  res.json({ success: true, data: rows });
});

/* ============================================================
   3. ADMIN MANAGEMENT & METRICS
============================================================ */

// Admin Dashboard Summary
app.get("/api/admin/dashboard", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  const [counts] = await pool.query<RowDataPacket[]>(`
    SELECT 
      COUNT(*) AS totalBookings,
      SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) AS pending,
      SUM(CASE WHEN status = 'CONFIRMED' THEN 1 ELSE 0 END) AS confirmed,
      SUM(CASE WHEN status = 'COMPLETED' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN status IN ('CONFIRMED', 'COMPLETED') THEN bill_amount ELSE 0 END) AS grossRevenue
    FROM bookings
  `);

  const [registeredClients] = await pool.query<RowDataPacket[]>(
    "SELECT COUNT(*) as count FROM users WHERE role = 'client'"
  );

  res.json({
    success: true,
    data: {
      totalBookings: counts[0].totalBookings || 0,
      pending: counts[0].pending || 0,
      confirmed: counts[0].confirmed || 0,
      completed: counts[0].completed || 0,
      grossRevenue: counts[0].grossRevenue || 0,
      registeredClients: registeredClients[0].count || 0,
    },
  });
});

// Admin All Bookings List
app.get("/api/admin/bookings", authenticate, requireAdmin, async (_req: Request, res: Response) => {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM bookings ORDER BY id DESC");
  res.json({ success: true, data: rows });
});

// Admin Update Booking Status
app.patch("/api/admin/bookings/:id/status", authenticate, requireAdmin, async (req: Request, res: Response) => {
  const { status } = req.body;
  const allowed = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"];
  if (!allowed.includes(status)) return res.status(400).json({ success: false, message: "Invalid status" });

  await pool.query("UPDATE bookings SET status = ? WHERE id = ?", [status, req.params.id]);
  res.json({ success: true, message: `Booking marked as ${status}` });
});

// Settings Query
app.get("/api/settings", async (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      salonName: "THE VIII SALON",
      phone: "+91 63624 29259",
      email: "theviiisalon88@gmail.com",
      address: "2nd Floor, No. 75, 100 Feet Ring Road, BTM Layout 2nd Stage, Bengaluru",
      openingHours: "Mon - Sun, 11:00 AM - 8:30 PM",
      isWalkInAllowed: true,
    },
  });
});

// 404 & Central Error Handler
app.use((_req, res) => res.status(404).json({ success: false, message: "Endpoint not found" }));
app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  res.status(500).json({ success: false, message: "Internal server error" });
});

export default app;