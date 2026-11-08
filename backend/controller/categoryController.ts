import { Request, Response } from "express";
import { pool } from "../config/database.js";
import { RowDataPacket, ResultSetHeader } from "mysql2";

export const getCategories = async (_req: Request, res: Response): Promise<void> => {
  const [rows] = await pool.query<RowDataPacket[]>("SELECT * FROM categories WHERE is_active = TRUE");
  res.json({ success: true, data: rows });
};

export const createCategory = async (req: Request, res: Response): Promise<void> => {
  const { name, description } = req.body;
  const slug = name.toLowerCase().replace(/\s+/g, "-");

  const [result] = await pool.query<ResultSetHeader>(
    "INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)",
    [name, slug, description || ""]
  );

  res.status(201).json({ success: true, data: { id: result.insertId, name, slug } });
};