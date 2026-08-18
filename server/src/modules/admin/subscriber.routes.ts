
import { Router } from "express";

import {
  createSubscriber,
  getSubscribers,
  getSubscriber,
  updateSubscriber,
  cancelSubscriber,
  deleteSubscriber,
} from "./subscriber.controller.js";

import { authenticate } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/permission.middleware.js";

const router = Router();

// =====================================================
// SUPER ADMIN — SUBSCRIBER CRUD
// =====================================================

// Create subscription
router.post(
  "/",
  authenticate,
  requirePermission(
    "admin.subscribers.manage"
  ),
  createSubscriber
);

// List subscriptions
router.get(
  "/",
  authenticate,
  requirePermission(
    "admin.subscribers.manage"
  ),
  getSubscribers
);

// Get one subscription
router.get(
  "/:id",
  authenticate,
  requirePermission(
    "admin.subscribers.manage"
  ),
  getSubscriber
);

// Update subscription
router.patch(
  "/:id",
  authenticate,
  requirePermission(
    "admin.subscribers.manage"
  ),
  updateSubscriber
);

// Cancel subscription
router.patch(
  "/:id/cancel",
  authenticate,
  requirePermission(
    "admin.subscribers.manage"
  ),
  cancelSubscriber
);

// Delete subscription
router.delete(
  "/:id",
  authenticate,
  requirePermission(
    "admin.subscribers.manage"
  ),
  deleteSubscriber
);

export default router;

