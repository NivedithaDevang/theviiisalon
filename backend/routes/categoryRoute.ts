import { Router } from "express";

import {
    getCategories,
    createCategory,
} from "../controller/categoryController.js";

import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Public
router.get("/", getCategories);

// Admin
router.get("/", authenticate, getCategories);
router.post("/", authenticate, createCategory);

export default router;