import { Router } from "express";
import { authController } from "../controller/authController.js";
import { requireAdminAuth } from "../middleware/authMiddleware.js";
const router = Router();
// Public
router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/logout", authController.logout);
// Protected (Admin only)
router.get("/me", requireAdminAuth, authController.getProfile);
router.patch("/change-password", requireAdminAuth, authController.changePassword);
export default router;
//# sourceMappingURL=authRoute.js.map