import { Router } from "express";

import {
    fetchCategories,
    fetchActiveCategories,
    addCategory,
    editCategory,
    changeCategoryStatus
} from "../controller/categoryController.js";

import { verifyAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// Public
router.get("/active", fetchActiveCategories);

// Admin
router.get("/", verifyAdmin, fetchCategories);
router.post("/", verifyAdmin, addCategory);
router.put("/:id", verifyAdmin, editCategory);
router.patch("/:id/status", verifyAdmin, changeCategoryStatus);

export default router;