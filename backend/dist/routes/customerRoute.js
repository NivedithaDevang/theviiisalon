import { Router } from "express";
import { fetchCustomers, fetchCustomerDetails, searchCustomerRecords } from "../controller/customerController.js";
import { requireAdminAuth } from "../middleware/authMiddleware.js";
const router = Router();
router.get("/", requireAdminAuth, fetchCustomers);
router.get("/search", requireAdminAuth, searchCustomerRecords);
router.get("/:id", requireAdminAuth, fetchCustomerDetails);
export default router;
//# sourceMappingURL=customerRoute.js.map