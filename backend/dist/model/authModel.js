import crypto from "crypto";
import bcrypt from "bcryptjs";
import { db } from "../config/database.js";
export const authModel = {
    async ensureDefaultAdmin() {
        const email = process.env.ADMIN_EMAIL?.trim().toLowerCase();
        const defaultPassword = process.env.ADMIN_DEFAULT_PASSWORD;
        if (!email || !defaultPassword) {
            console.warn("ADMIN_EMAIL or ADMIN_DEFAULT_PASSWORD is missing; default admin bootstrap skipped.");
            return;
        }
        const [admins] = await db.query("SELECT id FROM admins LIMIT 1");
        if (admins.length > 0)
            return;
        const passwordHash = await bcrypt.hash(defaultPassword, 12);
        await this.createAdmin(email, passwordHash);
        console.info("Created the initial admin account from configured environment credentials.");
    },
    // Timing-safe check for the salon admin secret key
    verifySecretKey(providedKey) {
        const expectedKey = process.env.ADMIN_SECRET_KEY;
        if (!expectedKey || !providedKey)
            return false;
        const providedBuf = Buffer.from(providedKey.trim());
        const expectedBuf = Buffer.from(expectedKey.trim());
        if (providedBuf.length !== expectedBuf.length)
            return false;
        return crypto.timingSafeEqual(providedBuf, expectedBuf);
    },
    // Find active or inactive admin by email (used during login)
    async findByEmail(email) {
        const [rows] = await db.query(`SELECT id, email, password_hash, role, is_active, created_at, updated_at
       FROM admins
       WHERE LOWER(email) = LOWER(?)
       LIMIT 1`, [email.trim()]);
        return rows.length > 0 ? rows[0] : null;
    },
    // Find admin by ID without exposing password_hash (used for JWT/session middleware)
    async findById(id) {
        const [rows] = await db.query(`SELECT id, email, role, is_active, created_at, updated_at
       FROM admins
       WHERE id = ?
       LIMIT 1`, [id]);
        return rows.length > 0 ? rows[0] : null;
    },
    // Create a new admin account
    async createAdmin(email, passwordHash, role = "ADMIN") {
        const [result] = await db.query(`INSERT INTO admins (email, password_hash, role)
       VALUES (?, ?, ?)`, [email.trim().toLowerCase(), passwordHash, role]);
        return result.insertId;
    },
    // Update admin password
    async updatePassword(id, newPasswordHash) {
        const [result] = await db.query(`UPDATE admins SET password_hash = ? WHERE id = ?`, [newPasswordHash, id]);
        return result.affectedRows > 0;
    },
};
//# sourceMappingURL=authModel.js.map