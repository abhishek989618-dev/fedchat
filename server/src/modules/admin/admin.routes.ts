
import { Router } from "express";

import {
  getUsers,
  getUser,
  updateUserStatus,
  forceLogoutUser,
} from "./admin.controller.js";

import { authenticate } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/permission.middleware.js";
import subscriberRoutes from "./subscriber.routes.js";


const router = Router();

// =====================================================
// ADMIN USERS
// =====================================================

router.get(
  "/users",
  authenticate,
  requirePermission("admin.users.read"),
  getUsers
);

router.get(
  "/users/:id",
  authenticate,
  requirePermission("admin.users.read"),
  getUser
);

router.patch(
  "/users/:id/status",
  authenticate,
  requirePermission("admin.users.manage"),
  updateUserStatus
);

router.post(
  "/users/:id/force-logout",
  authenticate,
  requirePermission("admin.users.manage"),
  forceLogoutUser
);

router.use(
  "/subscribers",
  subscriberRoutes
);

export default router;
