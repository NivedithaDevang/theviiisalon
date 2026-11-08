import { Request, Response } from "express";
import { pool } from "../config/database.js";
import { RowDataPacket } from "mysql2";

export const getSettings = async (_req: Request, res: Response): Promise<void> => {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM settings WHERE id = 1");
  res.json({ success: true, data: rows[0] || {} });
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  const { salon_name, phone, email, address, opening_hours, is_walk_in_allowed } = req.body;
  await pool.query(
    `UPDATE settings SET 
      salon_name = COALESCE(?, salon_name),
      phone = COALESCE(?, phone),
      email = COALESCE(?, email),
      address = COALESCE(?, address),
      opening_hours = COALESCE(?, opening_hours),
      is_walk_in_allowed = COALESCE(?, is_walk_in_allowed)
     WHERE id = 1`,
    [salon_name, phone, email, address, opening_hours, is_walk_in_allowed]
  );
  res.json({ success: true, message: "Settings updated successfully" });
};