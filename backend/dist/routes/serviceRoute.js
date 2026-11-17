import { Router } from "express";
import { serviceController } from "../controller/serviceController.js";
import { requireAdminAuth } from "../middleware/authMiddleware.js";
const router = Router();
// Public (Salon menu & Booking page)
router.get("/", serviceController.getPublicServices);
router.get("/categories", serviceController.getCategories);
router.get("/:id", serviceController.getServiceById);
// Protected (Admin dashboard)
router.get("/admin/all", requireAdminAuth, serviceController.getAdminServices);
router.post("/", requireAdminAuth, serviceController.createService);
router.put("/:id", requireAdminAuth, serviceController.updateService);
router.patch("/:id", requireAdminAuth, serviceController.updateService);
router.delete("/:id", requireAdminAuth, serviceController.deleteService);
export default router;
//# sourceMappingURL=serviceRoute.js.map