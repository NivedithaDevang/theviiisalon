import { Router } from "express";

import {
    fetchCustomers,
    fetchCustomerDetails,
    searchCustomerRecords
} from "../controller/customerController.js";

import { authenticate } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", authenticate, fetchCustomers);
router.get("/search", authenticate, searchCustomerRecords);
router.get("/:id", authenticate, fetchCustomerDetails);

export default router;