import db from "../config/database.js";
import { ResultSetHeader, RowDataPacket } from "mysql2";

export const getAllCategories = async () => {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT id, category_name, description, is_active, created_at
         FROM service_categories
         ORDER BY category_name ASC`
    );

    return rows;
};

export const getActiveCategories = async () => {
    const [rows] = await db.execute<RowDataPacket[]>(
        `SELECT id, category_name, description
         FROM service_categories
         WHERE is_active = TRUE
         ORDER BY category_name ASC`
    );

    return rows;
};

export const createCategory = async (
    categoryName: string,
    description: string
) => {
    const [result] = await db.execute<ResultSetHeader>(
        `INSERT INTO service_categories
         (category_name, description)
         VALUES (?, ?)`,
        [categoryName, description]
    );

    return result.insertId;
};

export const updateCategory = async (
    id: number,
    categoryName: string,
    description: string
) => {
    const [result] = await db.execute<ResultSetHeader>(
        `UPDATE service_categories
         SET category_name = ?, description = ?
         WHERE id = ?`,
        [categoryName, description, id]
    );

    return result.affectedRows;
};

export const toggleCategoryStatus = async (
    id: number,
    isActive: boolean
) => {
    const [result] = await db.execute<ResultSetHeader>(
        `UPDATE service_categories
         SET is_active = ?
         WHERE id = ?`,
        [isActive, id]
    );

    return result.affectedRows;
};