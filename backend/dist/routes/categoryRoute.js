import { Router } from "express";
import { getCategories, createCategory, } from "../controller/categoryController.js";
import { requireAdminAuth } from "../middleware/authMiddleware.js";
const router = Router();
// Public
router.get("/", getCategories);
// Admin
router.get("/", requireAdminAuth, getCategories);
router.post("/", requireAdminAuth, createCategory);
export default router;
//# sourceMappingURL=categoryRoute.js.map