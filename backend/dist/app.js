import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "node:crypto";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import { OAuth2Client } from "google-auth-library";
import { database as pool } from "./config/database.js";
import { sendAdminOTP, sendBookingEmail } from "./services/emailService.js";
const app = express();
const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);
const JWT_SECRET = process.env.JWT_SECRET || "viii_luxury_secret_2026";
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || "theviiisalon88@gmail.com").toLowerCase();
app.use(cors({ origin: process.env.FRONTEND_URL || "http://localhost:5173", credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Eliminates repetitive try/catch blocks in async routes
const asyncHandler = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
const setAuthCookie = (res, payload, maxAgeMs) => {
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: Math.floor(maxAgeMs / 1000) });
    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: maxAgeMs,
    });
};
const extractUserId = (req) => {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (!token)
        return null;
    try {
        return jwt.verify(token, JWT_SECRET).id;
    }
    catch {
        return null;
    }
};
const authenticate = asyncHandler(async (req, res, next) => {
    const userId = extractUserId(req);
    if (!userId)
        return res.status(401).json({ success: false, message: "Authentication required" });
    const [rows] = await pool.query("SELECT id, name, email, role FROM users WHERE id = ?", [userId]);
    if (!rows.length)
        return res.status(401).json({ success: false, message: "Session invalid" });
    req.user = rows[0];
    next();
});
const requireAdmin = (req, res, next) => {
    if (req.user?.role !== "admin") {
        return res.status(403).json({ success: false, message: "Restricted to salon management" });
    }
    next();
};
app.post("/api/auth/google", asyncHandler(async (req, res) => {
    const { credential } = req.body;
    if (!credential)
        return res.status(400).json({ success: false, message: "Missing credential token" });
    const ticket = await googleClient.verifyIdToken({
        idToken: credential,
        audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email)
        return res.status(400).json({ success: false, message: "Invalid Google payload" });
    const email = payload.email.toLowerCase();
    const [existing] = await pool.query("SELECT id, role FROM users WHERE email = ?", [email]);
    let userId;
    let role = "client";
    if (!existing.length) {
        const [insert] = await pool.query("INSERT INTO users (name, email, google_id, avatar, role) VALUES (?, ?, ?, ?, 'client')", [payload.name || "Client Guest", email, payload.sub, payload.picture || ""]);
        userId = insert.insertId;
    }
    else {
        ({ id: userId, role } = existing[0]);
    }
    setAuthCookie(res, { id: userId, role, email }, 30 * 24 * 60 * 60 * 1000);
    res.json({ success: true, data: { id: userId, name: payload.name, email, avatar: payload.picture, role } });
}));
app.post("/api/admin/login-request", asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    if (email?.toLowerCase() !== ADMIN_EMAIL) {
        return res.status(401).json({ success: false, message: "Unauthorized admin email" });
    }
    const [rows] = await pool.query("SELECT password FROM users WHERE email = ?", [ADMIN_EMAIL]);
    if (!rows.length) {
        const hashed = await bcrypt.hash(process.env.ADMIN_DEFAULT_PASSWORD || "TheVIII@2026", 10);
        await pool.query("INSERT INTO users (name, email, password, role) VALUES ('Keerthi', ?, ?, 'admin')", [
            ADMIN_EMAIL,
            hashed,
        ]);
    }
    else if (password && !(await bcrypt.compare(password, rows[0].password || ""))) {
        return res.status(401).json({ success: false, message: "Invalid admin password" });
    }
    const rawOtp = crypto.randomInt(100000, 999999).toString();
    const otpHash = crypto.createHash("sha256").update(rawOtp).digest("hex");
    const expires = new Date(Date.now() + 5 * 60 * 1000);
    await pool.query("UPDATE users SET admin_otp_hash = ?, admin_otp_expires = ? WHERE email = ?", [
        otpHash,
        expires,
        ADMIN_EMAIL,
    ]);
    await sendAdminOTP(ADMIN_EMAIL, rawOtp);
    res.json({ success: true, message: "Verification OTP dispatched to registered salon email" });
}));
app.post("/api/admin/verify-otp", asyncHandler(async (req, res) => {
    const { email, otp } = req.body;
    const [rows] = await pool.query("SELECT * FROM users WHERE email = ?", [email?.toLowerCase()]);
    const admin = rows[0];
    if (!admin?.admin_otp_hash || !admin.admin_otp_expires) {
        return res.status(400).json({ success: false, message: "OTP not requested or expired" });
    }
    if (new Date() > new Date(admin.admin_otp_expires)) {
        return res.status(400).json({ success: false, message: "OTP expired. Request a new one." });
    }
    const hashedInput = crypto.createHash("sha256").update(String(otp).trim()).digest("hex");
    if (hashedInput !== admin.admin_otp_hash) {
        return res.status(401).json({ success: false, message: "Invalid OTP code" });
    }
    await pool.query("UPDATE users SET admin_otp_hash = NULL, admin_otp_expires = NULL WHERE id = ?", [admin.id]);
    setAuthCookie(res, { id: admin.id, role: "admin", email: admin.email }, 12 * 60 * 60 * 1000);
    res.json({ success: true, data: { name: admin.name, email: admin.email, role: "admin" } });
}));
app.get("/api/auth/me", authenticate, (req, res) => {
    res.json({ success: true, data: req.user });
});
app.post("/api/auth/logout", (_req, res) => {
    res.clearCookie("token");
    res.json({ success: true, message: "Signed out successfully" });
});
app.post("/api/bookings", asyncHandler(async (req, res) => {
    const { name, phone, email, serviceName, date, time, notes, price } = req.body;
    if (!name?.trim() || !phone?.trim() || !serviceName || !date || !time) {
        return res.status(400).json({ success: false, message: "Please fill all required booking fields" });
    }
    const [conflict] = await pool.query("SELECT id FROM bookings WHERE booking_date = ? AND booking_time = ? AND status IN ('PENDING', 'CONFIRMED')", [date, time]);
    if (conflict.length) {
        return res.status(409).json({ success: false, message: "This slot is already reserved. Please choose another time." });
    }
    const userId = extractUserId(req);
    const reference = `VIII-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const cleanPrice = Number(String(price || "0").replace(/[^0-9]/g, "")) || 0;
    const [result] = await pool.query(`INSERT INTO bookings (reference, user_id, name, phone, email, service_name, booking_date, booking_time, notes, bill_amount, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'PENDING')`, [reference, userId, name.trim(), phone.trim(), email || null, serviceName, date, time, notes || "", cleanPrice]);
    if (email)
        sendBookingEmail(email, { reference, name, date, time, serviceName });
    res.status(201).json({
        success: true,
        data: { id: result.insertId, reference, name, serviceName, date, time, billAmount: cleanPrice },
    });
}));
app.get("/api/bookings/my-bookings", authenticate, asyncHandler(async (req, res) => {
    const [rows] = await pool.query("SELECT * FROM bookings WHERE user_id = ? OR email = ? ORDER BY id DESC", [req.user?.id, req.user?.email]);
    res.json({ success: true, data: rows });
}));
app.get("/api/admin/dashboard", authenticate, requireAdmin, asyncHandler(async (_req, res) => {
    const [[counts]] = await pool.query(`
      SELECT 
        COUNT(*) AS totalBookings,
        COALESCE(SUM(status = 'PENDING'), 0) AS pending,
        COALESCE(SUM(status = 'CONFIRMED'), 0) AS confirmed,
        COALESCE(SUM(status = 'COMPLETED'), 0) AS completed,
        COALESCE(SUM(CASE WHEN status IN ('CONFIRMED', 'COMPLETED') THEN bill_amount ELSE 0 END), 0) AS grossRevenue
      FROM bookings
    `);
    const [[clients]] = await pool.query("SELECT COUNT(*) AS count FROM users WHERE role = 'client'");
    res.json({ success: true, data: { ...counts, registeredClients: clients.count || 0 } });
}));
app.get("/api/admin/bookings", authenticate, requireAdmin, asyncHandler(async (_req, res) => {
    const [rows] = await pool.query("SELECT * FROM bookings ORDER BY id DESC");
    res.json({ success: true, data: rows });
}));
app.patch("/api/admin/bookings/:id/status", authenticate, requireAdmin, asyncHandler(async (req, res) => {
    const { status } = req.body;
    if (!["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED"].includes(status)) {
        return res.status(400).json({ success: false, message: "Invalid status" });
    }
    await pool.query("UPDATE bookings SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true, message: `Booking marked as ${status}` });
}));
app.get("/api/settings", (_req, res) => {
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
app.use((_req, res) => res.status(404).json({ success: false, message: "Endpoint not found" }));
app.use((err, _req, res, _next) => {
    console.error(err);
    res.status(500).json({ success: false, message: "Internal server error" });
});
export default app;
