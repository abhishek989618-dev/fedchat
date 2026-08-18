
import { Router } from "express";

import {
  createPlan,
  getPlans,
  getPlan,
  updatePlan,
  subscribe,
  getCurrentSubscription,
  getMySubscriptions,
  getMyAccessLevel,
} from "./subscription.controller.js";
import {
  requireSubscriptionRead,
  requireSubscriptionSend,
} from "../subscriptions/subscription.middleware.js";

import { authenticate } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/permission.middleware.js";

const router = Router();

/*
|--------------------------------------------------------------------------
| Public authenticated plan routes
|--------------------------------------------------------------------------
*/

// Get active subscription plans
router.get(
  "/plans",
  authenticate,
  getPlans
);

// Get single plan
router.get(
  "/plans/:id",
  authenticate,
  getPlan
);

/*
|--------------------------------------------------------------------------
| Admin plan management
|--------------------------------------------------------------------------
*/

// Create subscription plan
router.post(
  "/plans",
  authenticate,
  requirePermission("subscriptions.manage"),
  createPlan
);

// Update subscription plan
router.patch(
  "/plans/:id",
  authenticate,
  requirePermission("subscriptions.manage"),
  updatePlan
);

/*
|--------------------------------------------------------------------------
| Current user subscription
|--------------------------------------------------------------------------
*/

// Subscribe current user
router.post(
  "/subscribe",
  authenticate,
  subscribe
);

// Current active subscription
router.get(
  "/me",
  authenticate,
  getCurrentSubscription
);

// Subscription history
router.get(
  "/me/history",
  authenticate,
  getMySubscriptions
);

// Current access level
router.get(
  "/me/access-level",
  authenticate,
  getMyAccessLevel
);

export default router;

