import { ResultSetHeader, RowDataPacket } from "mysql2";
import { db } from "../config/database.js";

export interface ServiceRow extends RowDataPacket {
  id: number;
  category_id: number;
  sub_category: string;
  name: string;
  price: number;
  duration: number;
  description?: string;
  image?: string;
  featured: boolean;
  is_active: boolean;
  category_name?: string;
  // Frontend aliases for BookingPage.tsx
  category?: string;
  subcategory?: string;
}

export interface CreateServiceInput {
  categoryId: number;
  subCategory?: string;
  name: string;
  description?: string;
  price: number;
  duration: number;
  image?: string;
  featured?: boolean;
  isActive?: boolean;
}

export interface UpdateServiceInput {
  categoryId?: number;
  subCategory?: string;
  name?: string;
  description?: string;
  price?: number;
  duration?: number;
  image?: string;
  featured?: boolean;
  isActive?: boolean;
}

export const serviceModel = {
  // Get all active services (Public menu / Booking page)
  async findAllActive(): Promise<ServiceRow[]> {
    const [rows] = await db.query<ServiceRow[]>(
      `SELECT
        s.id,
        s.category_id,
        COALESCE(s.sub_category, '') AS sub_category,
        COALESCE(s.sub_category, '') AS subcategory,
        s.service_name AS name,
        s.price,
        s.duration_minutes AS duration,
        s.description,
        s.image_url AS image,
        s.is_featured AS featured,
        s.is_active,
        c.name AS category_name,
        c.name AS category
       FROM services s
       INNER JOIN service_categories c ON s.category_id = c.id
       WHERE s.is_active = TRUE AND c.is_active = TRUE
       ORDER BY c.id ASC, s.id ASC`
    );
    return rows;
  },

  // Get all services including inactive ones (Admin dashboard)
  async findAllAdmin(): Promise<ServiceRow[]> {
    const [rows] = await db.query<ServiceRow[]>(
      `SELECT
        s.id,
        s.category_id,
        COALESCE(s.sub_category, '') AS sub_category,
        COALESCE(s.sub_category, '') AS subcategory,
        s.service_name AS name,
        s.price,
        s.duration_minutes AS duration,
        s.description,
        s.image_url AS image,
        s.is_featured AS featured,
        s.is_active,
        c.name AS category_name,
        c.name AS category
       FROM services s
       INNER JOIN service_categories c ON s.category_id = c.id
       ORDER BY c.id ASC, s.id ASC`
    );
    return rows;
  },

  // Get single service by ID
  async findById(id: number): Promise<ServiceRow | null> {
    const [rows] = await db.query<ServiceRow[]>(
      `SELECT
        s.id,
        s.category_id,
        COALESCE(s.sub_category, '') AS sub_category,
        COALESCE(s.sub_category, '') AS subcategory,
        s.service_name AS name,
        s.price,
        s.duration_minutes AS duration,
        s.description,
        s.image_url AS image,
        s.is_featured AS featured,
        s.is_active,
        c.name AS category_name,
        c.name AS category
       FROM services s
       INNER JOIN service_categories c ON s.category_id = c.id
       WHERE s.id = ?
       LIMIT 1`,
      [id]
    );
    return rows.length > 0 ? rows[0] : null;
  },

  // Create a new service (Admin)
  async create(input: CreateServiceInput): Promise<number> {
    const [result] = await db.query<ResultSetHeader>(
      `INSERT INTO services
        (category_id, sub_category, service_name, description, price, duration_minutes, image_url, is_featured, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        input.categoryId,
        input.subCategory?.trim() || null,
        input.name.trim(),
        input.description?.trim() || null,
        Number(input.price),
        Number(input.duration) || 45,
        input.image?.trim() || null,
        Boolean(input.featured),
        input.isActive !== undefined ? Boolean(input.isActive) : true,
      ]
    );
    return result.insertId;
  },

  // Update an existing service (Admin)
  async update(id: number, input: UpdateServiceInput): Promise<boolean> {
    const fields: string[] = [];
    const params: unknown[] = [];

    if (input.categoryId !== undefined) {
      fields.push("category_id = ?");
      params.push(input.categoryId);
    }
    if (input.subCategory !== undefined) {
      fields.push("sub_category = ?");
      params.push(input.subCategory.trim() || null);
    }
    if (input.name !== undefined) {
      fields.push("service_name = ?");
      params.push(input.name.trim());
    }
    if (input.description !== undefined) {
      fields.push("description = ?");
      params.push(input.description.trim() || null);
    }
    if (input.price !== undefined) {
      fields.push("price = ?");
      params.push(Number(input.price));
    }
    if (input.duration !== undefined) {
      fields.push("duration_minutes = ?");
      params.push(Number(input.duration));
    }
    if (input.image !== undefined) {
      fields.push("image_url = ?");
      params.push(input.image.trim() || null);
    }
    if (input.featured !== undefined) {
      fields.push("is_featured = ?");
      params.push(Boolean(input.featured));
    }
    if (input.isActive !== undefined) {
      fields.push("is_active = ?");
      params.push(Boolean(input.isActive));
    }

    if (fields.length === 0) return false;

    params.push(id);
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE services SET ${fields.join(", ")} WHERE id = ?`,
      params
    );
    return result.affectedRows > 0;
  },

  // Soft-deactivate a service (Admin)
  async delete(id: number): Promise<boolean> {
    const [result] = await db.query<ResultSetHeader>(
      `UPDATE services SET is_active = FALSE WHERE id = ?`,
      [id]
    );
    return result.affectedRows > 0;
  },

  // Get all active categories
  async findAllCategories(): Promise<{ id: number; name: string }[]> {
    const [rows] = await db.query<RowDataPacket[]>(
      `SELECT id, name FROM service_categories WHERE is_active = TRUE ORDER BY id ASC`
    );
    return rows as { id: number; name: string }[];
  },
};