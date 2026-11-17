import { NextFunction, Request, Response } from "express";
import jwt from "jsonwebtoken";
import { AdminRole } from "../controller/authController.js";
import { authModel } from "../model/authModel.js";

export interface AuthRequest extends Request {
  admin?: {
    id: number;
    email: string;
    role: AdminRole;
  };
}

interface AdminJwtPayload {
  id: number;
  email: string;
  role: AdminRole;
}

export const requireAdminAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ success: false, message: "Authentication token required." });
      return;
    }

    const token = authHeader.split(" ")[1]?.trim();
    if (!token) {
      res.status(401).json({ success: false, message: "Authentication token missing." });
      return;
    }

    const secret = process.env.JWT_SECRET;
    if (!secret) {
      console.error("JWT_SECRET is missing in environment variables.");
      res.status(500).json({ success: false, message: "Server authentication configuration error." });
      return;
    }

    const decoded = jwt.verify(token, secret) as AdminJwtPayload;

    if (!decoded?.id || decoded.role !== "ADMIN") {
      res.status(403).json({ success: false, message: "Access denied. Admin privileges required." });
      return;
    }

    // Confirm the admin still exists and is active in MySQL
    const admin = await authModel.findById(decoded.id);
    if (!admin || !admin.is_active) {
      res.status(401).json({ success: false, message: "Admin account is inactive or no longer exists." });
      return;
    }

    req.admin = {
      id: admin.id,
      email: admin.email,
      role: "ADMIN",
    };

    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({ success: false, message: "Session expired. Please log in again." });
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({ success: false, message: "Invalid authentication token." });
      return;
    }
    console.error("Admin auth middleware error:", error);
    res.status(500).json({ success: false, message: "Internal server error." });
  }
};

export default requireAdminAuth;