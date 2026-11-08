import { Router } from "express";

import {
    fetchServices,
    fetchPublicServices,
    addService,
    editService,
    removeService
} from "../controller/serviceController.js";

import { verifyAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// Customer routes
router.get("/public", fetchPublicServices);

// Admin routes
router.get("/", verifyAdmin, fetchServices);
router.post("/", verifyAdmin, addService);
router.put("/:id", verifyAdmin, editService);
router.delete("/:id", verifyAdmin, removeService);

export default router;