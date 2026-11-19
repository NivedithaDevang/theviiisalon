import { Request, Response } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authModel } from "../model/authModel.js";

export type AdminRole = "ADMIN";

function signAdminToken(payload: {
  id: number;
  email: string;
  role: AdminRole;
}): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Please try again after some time");
  }
  return jwt.sign({ ...payload, tokenType: "admin-session" }, secret, {
    expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"]) || "7d",
  });
}

function signLoginChallenge(admin: { id: number; email: string }): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("Please try again after sometime");
  }
  return jwt.sign(
    { id: admin.id, email: admin.email, purpose: "admin-secret-verification" },
    secret,
    { expiresIn: "5m" }
  );
}

export const authController = {
  // POST /api/auth/login
  async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body as {
        email?: string;
        password?: string;
      };

      if (!email || !password) {
        res.status(400).json({ message: "Email and password are required." });
        return;
      }

      const admin = await authModel.findByEmail(email);
      if (!admin || !admin.is_active) {
        res.status(401).json({ message: "Entered email is incorrect. Please try again" });
        return;
      }

      const isPasswordValid = await bcrypt.compare(password, admin.password_hash);
      if (!isPasswordValid) {
        res.status(401).json({ message: "Entered password is incorrect. Please try again" });
        return;
      }

      res.status(200).json({
        message: "Email and password verified. Please enter secret key",
        data: {
          challengeToken: signLoginChallenge(admin),
        },
      });
    } catch (error) {
      console.error("Admin login error:", error);
      res.status(500).json({ message: "Internal server error. Please try again later" });
    }
  },

  // POST /api/auth/verify-secret-key
  async verifySecretKey(req: Request, res: Response): Promise<void> {
    try {
      const { challengeToken, secretKey } = req.body as {
        challengeToken?: string;
        secretKey?: string;
      };

      if (!challengeToken || !secretKey) {
        res.status(400).json({ message: "Secret key is required." });
        return;
      }

      const secret = process.env.JWT_SECRET;
      if (!secret) {
        throw new Error("Please try again after sometime");
      }

      const challenge = jwt.verify(challengeToken, secret) as {
        id: number;
        email: string;
        purpose: string;
      };
      if (
        challenge.purpose !== "admin-secret-verification" ||
        !challenge.id ||
        !challenge.email
      ) {
        res.status(401).json({ message: "Entered credentials is incorrect. Please sign in again." });
        return;
      }

      if (!authModel.verifySecretKey(secretKey)) {
        res.status(403).json({ message: "Entered admin secret key is incorrect." });
        return;
      }

      const admin = await authModel.findById(challenge.id);
      if (!admin || !admin.is_active || admin.email !== challenge.email) {
        res.status(401).json({ message: "Admin account is inactive or no longer exists." });
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
      if (error instanceof jwt.TokenExpiredError || error instanceof jwt.JsonWebTokenError) {
        res.status(401).json({ message: "Sessio expired. Please sign in again." });
        return;
      }
      console.error("Admin secret-key verification error:", error);
      res.status(500).json({ message: "Internal server error. Please try again later" });
    }
  },

};