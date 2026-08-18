
import { Router } from "express";

import {
  getAuditLogs,
  getAuditLog,
  deleteAuditLog,
} from "./audit-log.controller.js";

import { authenticate } from "../../core/middleware/auth.middleware.js";

import {
  requirePermission,
} from "../../core/middleware/permission.middleware.js";

const router = Router();

// =====================================================
// AUDIT LOGS
// =====================================================

// List audit logs
router.get(
  "/",
  authenticate,
  requirePermission(
    "admin.audit_logs.read"
  ),
  getAuditLogs
);

// Get one audit log
router.get(
  "/:id",
  authenticate,
  requirePermission(
    "admin.audit_logs.read"
  ),
  getAuditLog
);

// Delete audit log
router.delete(
  "/:id",
  authenticate,
  requirePermission(
    "admin.audit_logs.manage"
  ),
  deleteAuditLog
);

export default router;
