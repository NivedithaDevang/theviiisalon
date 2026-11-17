import { serviceModel } from "../model/serviceModel.js";
export const serviceController = {
    // GET /api/services (Public — used by BookingPage & ServicesPage)
    async getPublicServices(_req, res) {
        try {
            const services = await serviceModel.findAllActive();
            res.status(200).json({ success: true, data: services });
        }
        catch (error) {
            console.error("Get public services error:", error);
            res.status(500).json({ success: false, message: "Failed to load salon services." });
        }
    },
    // GET /api/services/categories (Public)
    async getCategories(_req, res) {
        try {
            const categories = await serviceModel.findAllCategories();
            res.status(200).json({ success: true, data: categories });
        }
        catch (error) {
            console.error("Get categories error:", error);
            res.status(500).json({ success: false, message: "Failed to load service categories." });
        }
    },
    // GET /api/services/admin (Protected — Admin Dashboard)
    async getAdminServices(_req, res) {
        try {
            const services = await serviceModel.findAllAdmin();
            res.status(200).json({ success: true, data: services });
        }
        catch (error) {
            console.error("Get admin services error:", error);
            res.status(500).json({ success: false, message: "Failed to load services." });
        }
    },
    // GET /api/services/:id (Public)
    async getServiceById(req, res) {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                res.status(400).json({ success: false, message: "Invalid service ID." });
                return;
            }
            const service = await serviceModel.findById(id);
            if (!service) {
                res.status(404).json({ success: false, message: "Service not found." });
                return;
            }
            res.status(200).json({ success: true, data: service });
        }
        catch (error) {
            console.error("Get service by ID error:", error);
            res.status(500).json({ success: false, message: "Failed to load service details." });
        }
    },
    // POST /api/services (Protected — Admin Create)
    async createService(req, res) {
        try {
            const { categoryId, category_id, name, description, price, duration, image, featured, isActive } = req.body;
            const resolvedCategoryId = Number(categoryId ?? category_id);
            if (!resolvedCategoryId || !name || price === undefined) {
                res.status(400).json({ success: false, message: "Category, service name, and price are required." });
                return;
            }
            const newId = await serviceModel.create({
                categoryId: resolvedCategoryId,
                name,
                description,
                price: Number(price),
                duration: Number(duration) || 45,
                image,
                featured: Boolean(featured),
                isActive: isActive !== undefined ? Boolean(isActive) : true,
            });
            const createdService = await serviceModel.findById(newId);
            res.status(201).json({
                success: true,
                message: "Service created successfully.",
                data: createdService,
            });
        }
        catch (error) {
            console.error("Create service error:", error);
            res.status(500).json({ success: false, message: "Failed to create service." });
        }
    },
    // PUT / PATCH /api/services/:id (Protected — Admin Update)
    async updateService(req, res) {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                res.status(400).json({ success: false, message: "Invalid service ID." });
                return;
            }
            const { categoryId, category_id, name, description, price, duration, image, featured, isActive, is_active } = req.body;
            const updated = await serviceModel.update(id, {
                categoryId: categoryId !== undefined || category_id !== undefined ? Number(categoryId ?? category_id) : undefined,
                name,
                description,
                price: price !== undefined ? Number(price) : undefined,
                duration: duration !== undefined ? Number(duration) : undefined,
                image,
                featured: featured !== undefined ? Boolean(featured) : undefined,
                isActive: isActive !== undefined || is_active !== undefined ? Boolean(isActive ?? is_active) : undefined,
            });
            if (!updated) {
                res.status(404).json({ success: false, message: "Service not found or no changes provided." });
                return;
            }
            const service = await serviceModel.findById(id);
            res.status(200).json({
                success: true,
                message: "Service updated successfully.",
                data: service,
            });
        }
        catch (error) {
            console.error("Update service error:", error);
            res.status(500).json({ success: false, message: "Failed to update service." });
        }
    },
    // DELETE /api/services/:id (Protected — Admin Soft Delete)
    async deleteService(req, res) {
        try {
            const id = Number(req.params.id);
            if (Number.isNaN(id)) {
                res.status(400).json({ success: false, message: "Invalid service ID." });
                return;
            }
            const deleted = await serviceModel.delete(id);
            if (!deleted) {
                res.status(404).json({ success: false, message: "Service not found." });
                return;
            }
            res.status(200).json({ success: true, message: "Service deactivated successfully." });
        }
        catch (error) {
            console.error("Delete service error:", error);
            res.status(500).json({ success: false, message: "Failed to delete service." });
        }
    },
};
//# sourceMappingURL=serviceController.js.map