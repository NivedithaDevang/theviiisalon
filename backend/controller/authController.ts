import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authModel } from "../model/authModel.js";

export type AdminRole = "ADMIN";

export interface AuthenticatedRequest extends Request {
  admin?: {
    id: number;
    email: string;
    role: AdminRole;
  };
}

function signAdminToken(payload: {
  id: number;
  email: string;
  role: AdminRole;
}): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured in environment variables.");
  }
  return jwt.sign(payload, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]) || "7d",
  });
}

export const authController = {
  // POST /api/auth/register
  async register(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, secretKey } = req.body as {
        email?: string;
        password?: string;
        secretKey?: string;
      };

      if (!email || !password || !secretKey) {
        res.status(400).json({ message: "Email, password, and admin secret key are required." });
        return;
      }

      if (!authModel.verifySecretKey(secretKey)) {
        res.status(403).json({ message: "Invalid admin secret key." });
        return;
      }

      if (password.length < 8) {
        res.status(400).json({ message: "Password must be at least 8 characters long." });
        return;
      }

      const existingAdmin = await authModel.findByEmail(email);
      if (existingAdmin) {
        res.status(409).json({ message: "An admin account with this email already exists." });
        return;
      }

      const assignedRole: AdminRole = "ADMIN";
      const normalizedEmail = email.trim().toLowerCase();
      const passwordHash = await bcrypt.hash(password, 12);
      const adminId = await authModel.createAdmin(normalizedEmail, passwordHash);

      const token = signAdminToken({
        id: adminId,
        email: normalizedEmail,
        role: assignedRole,
      });

      res.status(201).json({
        message: "Admin account created successfully.",
        data: {
          token,
          admin: {
            id: adminId,
            email: normalizedEmail,
            role: assignedRole,
          },
        },
      });
    } catch (error) {
      console.error("Admin register error:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  // POST /api/auth/login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password, secretKey } = req.body as {
        email?: string;
        password?: string;
        secretKey?: string;
      };

      if (!email || !password || !secretKey) {
        res.status(400).json({ message: "Email, password, and admin secret key are required." });
        return;
      }

      if (!authModel.verifySecretKey(secretKey)) {
        res.status(403).json({ message: "Invalid admin secret key." });
        return;
      }

      const admin = await authModel.findByEmail(email);
      if (!admin || !admin.is_active) {
        res.status(401).json({ message: "Invalid email or password." });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({ message: "Invalid email or password." });
        return;
      }

      const token = signAdminToken({
        id: admin.id,
        email: admin.email,
        role: "ADMIN",
      });

      res.status(200).json({
        message: "Login successful.",
        data: {
          token,
          admin: {
            id: admin.id,
            email: admin.email,
            role: "ADMIN",
          },
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  // GET /api/auth/me
  async getProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.admin?.id) {
        res.status(401).json({ message: "Unauthorized." });
        return;
      }

      const admin = await authModel.findById(req.admin.id);
      if (!admin || !admin.is_active) {
        res.status(404).json({ message: "Admin account not found or inactive." });
        return;
      }

      res.status(200).json({ data: admin });
    } catch (error) {
      console.error("Get admin profile error:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  // PATCH /api/auth/change-password
  async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.admin?.id) {
        res.status(401).json({ message: "Unauthorized." });
        return;
      }

      const { currentPassword, newPassword, secretKey } = req.body as {
        currentPassword?: string;
        newPassword?: string;
        secretKey?: string;
      };

      if (!currentPassword || !newPassword || !secretKey) {
        res.status(400).json({ message: "Current password, new password, and secret key are required." });
        return;
      }

      if (!authModel.verifySecretKey(secretKey)) {
        res.status(403).json({ message: "Invalid admin secret key." });
        return;
      }

      if (newPassword.length < 8) {
        res.status(400).json({ message: "New password must be at least 8 characters long." });
        return;
      }

      const admin = await authModel.findByEmail(req.admin.email);
      if (!admin) {
        res.status(404).json({ message: "Admin account not found." });
        return;
      }

      const isCurrentValid = await bcrypt.compare(currentPassword, admin.password_hash);
      if (!isCurrentValid) {
        res.status(401).json({ message: "Current password is incorrect." });
        return;
      }

      const newHash = await bcrypt.hash(newPassword, 12);
      await authModel.updatePassword(admin.id, newHash);

      res.status(200).json({ message: "Password updated successfully." });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ message: "Internal server error." });
    }
  },

  // POST /api/auth/logout
  async logout(_req: Request, res: Response): Promise<void> {
    res.status(200).json({ message: "Logged out successfully." });
  },
};