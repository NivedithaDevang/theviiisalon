import { Router } from "express";
import { createService, getAdminServices, getServiceCategories, getServices, removeService, updateService, } from "../controller/serviceController.js";
import { requireAdminAuth } from "../middleware/authMiddleware.js";
const router = Router();
router.get("/categories", requireAdminAuth, getServiceCategories);
router.get("/admin/all", requireAdminAuth, getAdminServices);
router.get("/", getServices);
router.post("/", requireAdminAuth, createService);
router.patch("/:id", requireAdminAuth, updateService);
router.delete("/:id", requireAdminAuth, removeService);
export default router;
//# sourceMappingURL=serviceRoute.js.map