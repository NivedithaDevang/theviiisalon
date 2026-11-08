import { Request, Response } from "express";
import { pool } from "../config/database.js";
import { ServiceRow } from "../model/serviceModel.js";
import { ResultSetHeader } from "mysql2";

export const getAllServices = async (req: Request, res: Response): Promise<void> => {
  let query = `
    SELECT s.*, c.name AS category_name, c.slug AS category_slug 
    FROM services s 
    JOIN categories c ON s.category_id = c.id 
    WHERE s.is_active = TRUE
  `;
  const params: any[] = [];

  if (req.query.featured === "true") {
    query += " AND s.featured = TRUE";
  }

  query += " ORDER BY s.id DESC";

  const [services] = await pool.query<ServiceRow[]>(query, params);
  res.json({ success: true, data: services });
};

export const createService = async (req: Request, res: Response): Promise<void> => {
  const { category_id, sub_category, name, price, duration, description, image, featured } = req.body;
  
  if (!category_id || !name || !price) {
    res.status(400).json({ success: false, message: "Category, name and price are required." });
    return;
  }

  const [result] = await pool.query<ResultSetHeader>(
    `INSERT INTO services (category_id, sub_category, name, price, duration, description, image, featured)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [category_id, sub_category || "General", name, price, duration || 45, description || "", image || "", Boolean(featured)]
  );

  res.status(201).json({ success: true, data: { id: result.insertId, ...req.body } });
};

export const updateService = async (req: Request, res: Response): Promise<void> => {
  const { category_id, sub_category, name, price, duration, description, image, featured, is_active } = req.body;
  const { id } = req.params;

  await pool.query(
    `UPDATE services SET 
      category_id = COALESCE(?, category_id),
      sub_category = COALESCE(?, sub_category),
      name = COALESCE(?, name),
      price = COALESCE(?, price),
      duration = COALESCE(?, duration),
      description = COALESCE(?, description),
      image = COALESCE(?, image),
      featured = COALESCE(?, featured),
      is_active = COALESCE(?, is_active)
     WHERE id = ?`,
    [category_id, sub_category, name, price, duration, description, image, featured, is_active, id]
  );

  res.json({ success: true, message: "Service updated successfully" });
};

export const deleteService = async (req: Request, res: Response): Promise<void> => {
  // Soft delete so previous booking history remains intact
  await pool.query("UPDATE services SET is_active = FALSE WHERE id = ?", [req.params.id]);
  res.json({ success: true, message: "Service deactivated successfully" });
};