import { Router } from "express";

import {
    getAllServices,
    createService,
    updateService,
    deleteService
} from "../controller/serviceController.js";

import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

// Customer routes
router.get("/", getAllServices);

// Admin routes
router.get("/", authenticate, getAllServices);
router.post("/", authenticate, createService);
router.put("/:id", authenticate, updateService);
router.delete("/:id", authenticate, deleteService);

export default router;