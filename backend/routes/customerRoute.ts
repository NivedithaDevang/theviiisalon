import { Router } from "express";

import {
    fetchCustomers,
    fetchCustomerDetails,
    searchCustomerRecords
} from "../controller/customerController.js";

import { verifyAdmin } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/", verifyAdmin, fetchCustomers);
router.get("/search", verifyAdmin, searchCustomerRecords);
router.get("/:id", verifyAdmin, fetchCustomerDetails);

export default router;