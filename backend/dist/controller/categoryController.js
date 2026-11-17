import { db } from "../config/database.js";
export const getCategories = async (_req, res) => {
    const [rows] = await db.query("SELECT * FROM categories WHERE is_active = TRUE");
    res.json({ success: true, data: rows });
};
export const createCategory = async (req, res) => {
    const { name, description } = req.body;
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    const [result] = await db.query("INSERT INTO categories (name, slug, description) VALUES (?, ?, ?)", [name, slug, description || ""]);
    res.status(201).json({ success: true, data: { id: result.insertId, name, slug } });
};
//# sourceMappingURL=categoryController.js.map