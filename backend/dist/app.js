import express from "express";
import cors from "cors";
import crypto from "node:crypto";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
const app = express();
const services = [
    { id: 1, category: "Hair", name: "The VIII Signature Cut", description: "A tailored cut, finish and styling ritual designed around your features.", price: 1800, duration: 60, image: "https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=900&q=85", featured: true },
    { id: 2, category: "Skin", name: "Champagne Glow Facial", description: "A luminous skin ritual with hydration, massage and a quiet reset.", price: 2500, duration: 75, image: "https://images.unsplash.com/photo-1570172619644-dfd03ed5d881?auto=format&fit=crop&w=900&q=85", featured: true },
    { id: 3, category: "Makeup", name: "Editorial Evening Makeup", description: "Polished, modern makeup for celebrations, portraits and special evenings.", price: 4500, duration: 90, image: "https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&w=900&q=85", featured: false },
    { id: 4, category: "Hair", name: "Silk Press & Finish", description: "A glossy, smooth finish with heat protection and restorative care.", price: 2200, duration: 90, image: "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?auto=format&fit=crop&w=900&q=85", featured: true }
];
const bookings = [];
const categories = ["Hair", "Skin", "Makeup", "Nails", "Spa"];
const adminEmail = process.env.ADMIN_EMAIL || "admin@theviiisalon.com";
const adminPasswordHash = bcrypt.hashSync(process.env.ADMIN_PASSWORD || "change-this-password", 10);
const jwtSecret = process.env.JWT_SECRET || "development-only-change-me";
app.use(cors({
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
const requireAdmin = (req, res, next) => {
    const token = req.cookies?.adminToken;
    if (!token) {
        res.status(401).json({ success: false, message: "Authentication required" });
        return;
    }
    try {
        req.user = jwt.verify(token, jwtSecret);
        next();
    }
    catch {
        res.status(401).json({ success: false, message: "Session expired" });
    }
};
app.get("/", (req, res) => {
    res.json({
        success: true,
        message: "THE VIII SALON API is running"
    });
});
app.get("/api/services", (_req, res) => res.json({ success: true, data: services }));
app.get("/api/categories", (_req, res) => res.json({ success: true, data: categories }));
app.get("/api/settings", (_req, res) => res.json({ success: true, data: {
        name: "THE VIII SALON", phone: "+91 6362429259", email: "theviiisalon88@gmail.com",
        address: "Bengaluru, Karnataka", hours: "Mon - Sun, 10:00 AM - 8:00 PM"
    } }));
app.get("/api/bookings/:reference", (req, res) => {
    const booking = bookings.find((item) => item.reference === req.params.reference);
    if (!booking)
        return res.status(404).json({ success: false, message: "Booking not found" });
    return res.json({ success: true, data: booking });
});
app.get("/api/availability", (req, res) => {
    const date = String(req.query.date || "");
    const taken = bookings.filter((item) => item.date === date && ["PENDING", "CONFIRMED"].includes(String(item.status))).map((item) => item.time);
    const slots = ["10:00", "11:30", "13:00", "15:00", "16:30", "18:00"].filter((slot) => !taken.includes(slot));
    res.json({ success: true, data: slots });
});
app.post("/api/bookings", (req, res) => {
    const { name, phone, email, serviceId, date, time, notes } = req.body;
    const service = services.find((item) => item.id === Number(serviceId));
    if (!name?.trim() || !/^\+?[0-9\s-]{10,15}$/.test(phone || "") || !service || !date || !time) {
        return res.status(400).json({ success: false, message: "Please complete all required booking details." });
    }
    const reference = `VIII-${crypto.randomBytes(3).toString("hex").toUpperCase()}`;
    const slotTaken = bookings.some((item) => item.date === date && item.time === time && ["PENDING", "CONFIRMED"].includes(String(item.status)));
    if (slotTaken)
        return res.status(409).json({ success: false, message: "That appointment time is no longer available." });
    const booking = { reference, name: name.trim(), phone, email, service, date, time, notes: notes || "", status: "PENDING", createdAt: new Date().toISOString() };
    bookings.push(booking);
    return res.status(201).json({ success: true, data: booking });
});
app.post("/api/admin/login", async (req, res) => {
    const { email, password } = req.body;
    if (email !== adminEmail || typeof password !== "string" || !(await bcrypt.compare(password, adminPasswordHash))) {
        res.status(401).json({ success: false, message: "Invalid email or password" });
        return;
    }
    const token = jwt.sign({ email, role: "ADMIN" }, jwtSecret, { expiresIn: "8h" });
    res.cookie("adminToken", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 8 * 60 * 60 * 1000 });
    res.json({ success: true, data: { email } });
});
app.post("/api/admin/logout", (_req, res) => { res.clearCookie("adminToken"); res.json({ success: true }); });
app.get("/api/admin/me", requireAdmin, (req, res) => res.json({ success: true, data: { email: req.user?.email || adminEmail } }));
app.get("/api/admin/bookings", requireAdmin, (_req, res) => res.json({ success: true, data: bookings }));
app.patch("/api/admin/bookings/:reference/status", requireAdmin, (req, res) => {
    const booking = bookings.find((item) => item.reference === req.params.reference);
    const allowed = ["PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "REJECTED"];
    if (!booking || !allowed.includes(req.body.status))
        return res.status(400).json({ success: false, message: "Invalid booking or status" });
    booking.status = req.body.status;
    return res.json({ success: true, data: booking });
});
app.post("/api/admin/services", requireAdmin, (req, res) => {
    const { category, name, description, price, duration, image, featured } = req.body;
    if (!name?.trim() || !category || !Number(price) || !Number(duration))
        return res.status(400).json({ success: false, message: "Service details are incomplete" });
    const service = { id: Math.max(...services.map((item) => item.id)) + 1, category, name: name.trim(), description: description || "", price: Number(price), duration: Number(duration), image: image || services[0].image, featured: Boolean(featured) };
    services.push(service);
    return res.status(201).json({ success: true, data: service });
});
app.get("/api/admin/dashboard", requireAdmin, (_req, res) => res.json({ success: true, data: {
        totalBookings: bookings.length, pending: bookings.filter((item) => item.status === "PENDING").length,
        confirmed: bookings.filter((item) => item.status === "CONFIRMED").length, activeServices: services.length
    } }));
app.use((_req, res) => res.status(404).json({ success: false, message: "Route not found" }));
app.use((error, _req, res, _next) => {
    console.error(error);
    res.status(500).json({ success: false, message: "Something went wrong" });
});
export default app;
