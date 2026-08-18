
import { Router } from "express";

import {
  createPaymentMethod,
  getPaymentMethods,
  getPaymentMethod,
  updatePaymentMethod,
  createPaymentRequest,
  getMyPaymentRequests,
  getPaymentRequest,
  getPendingPaymentRequests,
  getPaymentRequestsByStatus,
} from "./payment.controller.js";

import {
  approvePaymentRequest,
  rejectPaymentRequest,
} from "./payment.controller.js";

import { authenticate } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/permission.middleware.js";

const router = Router();

// =====================================================
// PAYMENT METHODS
// =====================================================

// List active payment methods
router.get(
  "/methods",
  authenticate,
  getPaymentMethods
);

// Get payment method
router.get(
  "/methods/:id",
  authenticate,
  getPaymentMethod
);

// Create payment method - Admin
router.post(
  "/methods",
  authenticate,
  requirePermission("payments.manage"),
  createPaymentMethod
);

// Update payment method - Admin
router.patch(
  "/methods/:id",
  authenticate,
  requirePermission("payments.manage"),
  updatePaymentMethod
);

// =====================================================
// USER PAYMENT REQUESTS
// =====================================================

// Submit payment
router.post(
  "/requests",
  authenticate,
  createPaymentRequest
);

// My payment requests
router.get(
  "/requests/me",
  authenticate,
  getMyPaymentRequests
);

// =====================================================
// ADMIN PAYMENT REQUESTS
// (must be registered before "/requests/:id" — otherwise
// "pending" / "status" are swallowed as an :id param)
// =====================================================

// Pending requests
router.get(
  "/requests/pending",
  authenticate,
  requirePermission("payments.manage"),
  getPendingPaymentRequests
);

// Requests by status
router.get(
  "/requests/status/:status",
  authenticate,
  requirePermission("payments.manage"),
  getPaymentRequestsByStatus
);

// Get a payment request
router.get(
  "/requests/:id",
  authenticate,
  getPaymentRequest
);

// Approve payment + activate subscription
router.patch(
  "/requests/:id/approve",
  authenticate,
  requirePermission("payments.manage"),
  approvePaymentRequest
);

// Reject payment
router.patch(
  "/requests/:id/reject",
  authenticate,
  requirePermission("payments.manage"),
  rejectPaymentRequest
);



export default router;

