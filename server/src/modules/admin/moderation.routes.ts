import { Router } from "express";
import { authenticate } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/permission.middleware.js";
import { banUser, unbanUser, forceLogout } from "./moderation.controller.js";

const router = Router();

router.patch("/users/:id/ban", authenticate, requirePermission("admin.users.manage"), banUser);
router.patch("/users/:id/unban", authenticate, requirePermission("admin.users.manage"), unbanUser);
router.post("/users/:id/force-logout", authenticate, requirePermission("admin.users.manage"), forceLogout);

export default router;
