import { Router } from "express";

import {
  getRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  assignPermission,
  removePermission,
  getPermissions
} from "./roles.controller.js";

import {
  authenticate
} from "../../core/middleware/auth.middleware.js";

import {
  requirePermission
} from "../../core/middleware/permission.middleware.js";

const router = Router();

router.use(authenticate);

router.get(
  "/permissions",
  requirePermission("roles.read"),
  getPermissions
);

router.get(
  "/",
  requirePermission("roles.read"),
  getRoles
);

router.post(
  "/",
  requirePermission("roles.create"),
  createRole
);

router.get(
  "/:id",
  requirePermission("roles.read"),
  getRole
);

router.patch(
  "/:id",
  requirePermission("roles.update"),
  updateRole
);

router.delete(
  "/:id",
  requirePermission("roles.delete"),
  deleteRole
);

router.post(
  "/:id/permissions",
  requirePermission("roles.update"),
  assignPermission
);

router.delete(
  "/:id/permissions/:permissionId",
  requirePermission("roles.update"),
  removePermission
);

export default router;