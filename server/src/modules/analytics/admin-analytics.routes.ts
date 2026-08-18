import { Router } from "express";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/permission.middleware.js";
import { getDashboardAnalytics } from "./admin-analytics.controller.js";

const router = Router();

router.get("/", authenticate, requirePermission("admin.analytics.read"), getDashboardAnalytics);

export default router;
