import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { pool } from "../config/database.js";
import { UserRow } from "../model/authModel.js";

export interface AuthenticatedUser {
  id: number;
  name: string;
  email: string;
  role: "client" | "admin";
}

export interface AuthRequest extends Request {
  user?: AuthenticatedUser;
}

interface JwtPayload {
  id: number;
  role: "client" | "admin";
  email: string;
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extract token from HttpOnly cookie or Authorization Bearer header
    const token =
      req.cookies?.token ||
      (req.headers.authorization?.startsWith("Bearer ")
        ? req.headers.authorization.split(" ")[1]
        : null);

    if (!token) {
      res.status(401).json({
        success: false,
        message: "Authentication required. Please sign in to access your sanctuary.",
      });
      return;
    }

    // 2. Verify JWT signature
    const secret = process.env.JWT_SECRET || "viii_luxury_secret_2026";
    const decoded = jwt.verify(token, secret) as JwtPayload;

    // 3. Ensure user exists in MySQL
    const [rows] = await pool.query<UserRow[]>(
      "SELECT id, name, email, role FROM users WHERE id = ?",
      [decoded.id]
    );

    if (rows.length === 0) {
      res.status(401).json({
        success: false,
        message: "User session is invalid or user no longer exists.",
      });
      return;
    }

    // 4. Attach typed user to request
    req.user = {
      id: rows[0].id,
      name: rows[0].name,
      email: rows[0].email,
      role: rows[0].role,
    };

    next();
  } catch (error: any) {
    if (error.name === "TokenExpiredError") {
      res.status(401).json({
        success: false,
        message: "Your session has expired. Please sign in again.",
      });
      return;
    }

    res.status(401).json({
      success: false,
      message: "Invalid authentication credentials.",
    });
  }
};