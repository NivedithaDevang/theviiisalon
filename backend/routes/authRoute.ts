import { Router } from "express";
import rateLimit from "express-rate-limit";
import { authController } from "../controller/authController.js";

const router = Router();
const loginRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: { message: "Too many sign-in attempts. Please try again later." },
});

router.post("/login", loginRateLimit, authController.login);
router.post("/verify-secret-key", loginRateLimit, authController.verifySecretKey);

export default router;