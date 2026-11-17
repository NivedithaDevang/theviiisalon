import { db } from "../config/database.js";
export const getAllCategories = async () => {
    const [rows] = await db.execute(`SELECT id, category_name, description, is_active, created_at
         FROM service_categories
         ORDER BY category_name ASC`);
    return rows;
};
export const getActiveCategories = async () => {
    const [rows] = await db.execute(`SELECT id, category_name, description
         FROM service_categories
         WHERE is_active = TRUE
         ORDER BY category_name ASC`);
    return rows;
};
export const createCategory = async (categoryName, description) => {
    const [result] = await db.execute(`INSERT INTO service_categories
         (category_name, description)
         VALUES (?, ?)`, [categoryName, description]);
    return result.insertId;
};
export const updateCategory = async (id, categoryName, description) => {
    const [result] = await db.execute(`UPDATE service_categories
         SET category_name = ?, description = ?
         WHERE id = ?`, [categoryName, description, id]);
    return result.affectedRows;
};
export const toggleCategoryStatus = async (id, isActive) => {
    const [result] = await db.execute(`UPDATE service_categories
         SET is_active = ?
         WHERE id = ?`, [isActive, id]);
    return result.affectedRows;
};
//# sourceMappingURL=categoryModel.js.map