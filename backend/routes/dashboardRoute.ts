import { Router } from "express";
import { getDashboardMetrics } from "../controller/dashboardController.js";
import { requireAdminAuth } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/stats", requireAdminAuth, getDashboardMetrics);

export default router;