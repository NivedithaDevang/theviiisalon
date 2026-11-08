import { Router } from "express";
import { fetchDashboardStats } from "../controller/dashboardController.js";
import { verifyAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/stats", verifyAdmin, fetchDashboardStats);

export default router;