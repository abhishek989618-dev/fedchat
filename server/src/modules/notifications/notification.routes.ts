
import { Router } from "express";

import {
  createNotification,
  getNotifications,
  getNotificationById,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification
} from "./notification.controller.js";

import { authenticate } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/permission.middleware.js";

const router = Router();

// All notification endpoints require authentication.
router.use(authenticate);

// Create notification
router.post(
  "/",
  requirePermission("notifications.manage"),
  createNotification
);

// Get current user's notifications
router.get(
  "/",
  requirePermission("notifications.read"),
  getNotifications
);

// Get one notification
router.get(
  "/:notificationId",
  requirePermission("notifications.read"),
  getNotificationById
);

// Mark one notification as read
router.patch(
  "/:notificationId/read",
  requirePermission("notifications.read"),
  markNotificationRead
);

// Mark all notifications as read
router.patch(
  "/read-all",
  requirePermission("notifications.read"),
  markAllNotificationsRead
);

// Delete notification
router.delete(
  "/:notificationId",
  requirePermission("notifications.manage"),
  deleteNotification
);

export default router;

