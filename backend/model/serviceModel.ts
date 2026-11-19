import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../config/database.js";

export interface ServiceRow extends RowDataPacket {
  id: number;
  category_id: number;
  name: string;
  price: number;
  duration: number;
  description: string | null;
  featured: boolean;
  is_active: boolean;
  category: string;
}

export interface ServiceCategoryRow extends RowDataPacket {
  id: number;
  name: string;
}

export interface ServiceInput {
  categoryId: number;
  name: string;
  price: number;
  duration: number;
  description: string;
  isActive: boolean;
}

export const serviceModel = {
  async getAllServices(): Promise<ServiceRow[]> {
    const [rows] = await db.query<ServiceRow[]>(
      `SELECT
        s.id,
        s.category_id,
        s.service_name AS name,
        s.price,
        s.duration_minutes AS duration,
        s.description,
        s.is_featured AS featured,
        s.is_active,
        c.name AS category
       FROM services s
       INNER JOIN service_categories c ON s.category_id = c.id
       WHERE s.is_active = 1 AND c.is_active = 1
       ORDER BY c.id ASC, s.id ASC`
    );
    return rows;
  },

  async getAllAdminServices(): Promise<ServiceRow[]> {
    const [rows] = await db.query<ServiceRow[]>(
      `SELECT
        s.id,
        s.category_id,
        s.service_name AS name,
        s.price,
        s.duration_minutes AS duration,
        s.description,
        s.is_featured AS featured,
        s.is_active,
        c.name AS category
       FROM services s
       INNER JOIN service_categories c ON s.category_id = c.id
       WHERE s.is_active = 1 AND c.is_active = 1
       ORDER BY c.id ASC, s.id ASC`
    );
    return rows;
  },

  async getActiveCategories(): Promise<ServiceCategoryRow[]> {
    const [rows] = await db.query<ServiceCategoryRow[]>(
      `SELECT id, name
       FROM service_categories
       WHERE is_active = 1
       ORDER BY name ASC`
    );
    return rows;
  },

  async hasActiveCategory(categoryId: number): Promise<boolean> {
    const [rows] = await db.query<ServiceCategoryRow[]>(
      `SELECT id
       FROM service_categories
       WHERE id = ? AND is_active = 1
       LIMIT 1`,
      [categoryId]
    );
    return rows.length > 0;
  },

  async serviceExists(id: number): Promise<boolean> {
    const [rows] = await db.query<RowDataPacket[]>(
      "SELECT id FROM services WHERE id = ? AND is_active = 1 LIMIT 1",
      [id]
    );
    return rows.length > 0;
  },

  async createService(input: ServiceInput): Promise<number> {
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      const [existingActive] = await connection.query<RowDataPacket[]>(
        `SELECT id
         FROM services
         WHERE category_id = ?
           AND LOWER(TRIM(service_name)) = LOWER(TRIM(?))
           AND is_active = 1
         LIMIT 1
         FOR UPDATE`,
        [input.categoryId, input.name]
      );

      if (existingActive.length > 0) {
        throw new Error("DUPLICATE_SERVICE");
      }

      const [result] = await connection.query<ResultSetHeader>(
        `INSERT INTO services
          (category_id, service_name, price, duration_minutes, description, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`,
        [
          input.categoryId,
          input.name.trim(),
          input.price,
          input.duration,
          input.description || null,
        ]
      );

      await connection.commit();
      return result.insertId;
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  },

  async updateService(id: number, input: ServiceInput): Promise<void> {
    await db.query<ResultSetHeader>(
      `UPDATE services
       SET category_id = ?,
           service_name = ?,
           price = ?,
           duration_minutes = ?,
           description = ?,
           is_active = 1
       WHERE id = ?`,
      [
        input.categoryId,
        input.name.trim(),
        input.price,
        input.duration,
        input.description || null,
        id,
      ]
    );
  },

  async deleteService(id: number): Promise<void> {
    try {
      await db.query<ResultSetHeader>("DELETE FROM services WHERE id = ?", [id]);
    } catch (error: unknown) {
      const err = error as { code?: string };
      if (err.code === "ER_ROW_IS_REFERENCED_2" || err.code === "ER_ROW_IS_REFERENCED") {
        await db.query<ResultSetHeader>(
          "UPDATE services SET is_active = 0 WHERE id = ?",
          [id]
        );
        return;
      }
      throw error;
    }
  },
};

export const getAllServices = () => serviceModel.getAllServices();