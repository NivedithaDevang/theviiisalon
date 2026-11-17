import { Router } from "express";
import { createBooking, getAdminBookings, updateBookingStatus, } from "../controller/bookingController.js";
import { requireAdminAuth } from "../middleware/authMiddleware.js";
const router = Router();
// Public (Customer booking & lookup)
router.post("/", createBooking);
// Protected (Admin dashboard)
router.get("/", requireAdminAuth, getAdminBookings);
router.patch("/:id/status", requireAdminAuth, updateBookingStatus);
export default router;
//# sourceMappingURL=bookingRoute.js.map