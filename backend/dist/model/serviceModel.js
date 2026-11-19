import { db } from "../config/database.js";
export const serviceModel = {
    async getAllServices() {
        const [rows] = await db.query(`SELECT
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
       ORDER BY c.id ASC, s.id ASC`);
        return rows;
    },
    async getAllAdminServices() {
        const [rows] = await db.query(`SELECT
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
       ORDER BY c.id ASC, s.id ASC`);
        return rows;
    },
    async getActiveCategories() {
        const [rows] = await db.query(`SELECT id, name
       FROM service_categories
       WHERE is_active = 1
       ORDER BY name ASC`);
        return rows;
    },
    async hasActiveCategory(categoryId) {
        const [rows] = await db.query(`SELECT id
       FROM service_categories
       WHERE id = ? AND is_active = 1
       LIMIT 1`, [categoryId]);
        return rows.length > 0;
    },
    async serviceExists(id) {
        const [rows] = await db.query("SELECT id FROM services WHERE id = ? AND is_active = 1 LIMIT 1", [id]);
        return rows.length > 0;
    },
    async createService(input) {
        const connection = await db.getConnection();
        try {
            await connection.beginTransaction();
            const [existingActive] = await connection.query(`SELECT id
         FROM services
         WHERE category_id = ?
           AND LOWER(TRIM(service_name)) = LOWER(TRIM(?))
           AND is_active = 1
         LIMIT 1
         FOR UPDATE`, [input.categoryId, input.name]);
            if (existingActive.length > 0) {
                throw new Error("DUPLICATE_SERVICE");
            }
            const [result] = await connection.query(`INSERT INTO services
          (category_id, service_name, price, duration_minutes, description, is_active)
         VALUES (?, ?, ?, ?, ?, 1)`, [
                input.categoryId,
                input.name.trim(),
                input.price,
                input.duration,
                input.description || null,
            ]);
            await connection.commit();
            return result.insertId;
        }
        catch (error) {
            await connection.rollback();
            throw error;
        }
        finally {
            connection.release();
        }
    },
    async updateService(id, input) {
        await db.query(`UPDATE services
       SET category_id = ?,
           service_name = ?,
           price = ?,
           duration_minutes = ?,
           description = ?,
           is_active = 1
       WHERE id = ?`, [
            input.categoryId,
            input.name.trim(),
            input.price,
            input.duration,
            input.description || null,
            id,
        ]);
    },
    async deleteService(id) {
        try {
            await db.query("DELETE FROM services WHERE id = ?", [id]);
        }
        catch (error) {
            const err = error;
            if (err.code === "ER_ROW_IS_REFERENCED_2" || err.code === "ER_ROW_IS_REFERENCED") {
                await db.query("UPDATE services SET is_active = 0 WHERE id = ?", [id]);
                return;
            }
            throw error;
        }
    },
};
export const getAllServices = () => serviceModel.getAllServices();
//# sourceMappingURL=serviceModel.js.map