import { Router } from "express";
import authRoutes from "./authRoute.js";
import bookingRoutes from "./bookingRoute.js";
import dashboardRoutes from "./dashboardRoute.js";
import serviceRoutes from "./serviceRoute.js";
const router = Router();
router.use("/auth", authRoutes);
router.use("/bookings", bookingRoutes);
router.use("/dashboard", dashboardRoutes);
router.use("/services", serviceRoutes);
export default router;
//# sourceMappingURL=index.js.map