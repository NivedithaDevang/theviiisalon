import { Router } from "express";
import { getDashboardMetrics } from "../controller/dashboardController.js";
import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/stats", authenticate, getDashboardMetrics);

export default router;