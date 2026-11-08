import { Response, NextFunction } from "express";
import { AuthRequest } from "../middleware/authMiddleware.js";
import { pool } from "../config/database.js";
import { UserRow } from "../model/authModel.js";

/**
 * Middleware to restrict endpoints exclusively to salon management / owners.
 * Must be executed AFTER authenticate middleware: [authenticate, requireAdmin]
 */
export const requireAdmin = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Check if authenticated user object exists on request
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: "Authentication required. Please log in first.",
      });
      return;
    }

    // 2. Validate role stored in the verified JWT
    if (req.user.role !== "admin") {
      res.status(403).json({
        success: false,
        message: "Access denied: Restricted to salon administrators.",
      });
      return;
    }

    // 3. Database check to verify role status in MySQL
    const [rows] = await pool.query<UserRow[]>(
      "SELECT id, role FROM users WHERE id = ? AND role = 'admin' LIMIT 1",
      [req.user.id]
    );

    if (rows.length === 0) {
      res.status(403).json({
        success: false,
        message: "Unauthorized: Administrative privileges not found.",
      });
      return;
    }

    next();
  } catch (error) {
    console.error("Admin authorization error:", error);
    res.status(500).json({
      success: false,
      message: "Authorization verification failure.",
    });
  }
};