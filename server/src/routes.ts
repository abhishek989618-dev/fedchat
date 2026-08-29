
import { Router } from "express";

import authRoutes from "./modules/auth/auth.routes.js";
import usersRoutes from "./modules/users/users.routes.js";
import rolesRoutes from "./modules/roles/roles.routes.js";
import roomsRoutes from "./modules/rooms/rooms.routes.js";
import messagesRoutes from "./modules/messages/messages.routes.js";
import notificationRouter from "./modules/notifications/notification.routes.js";
import subscriptionRoutes from "./modules/subscriptions/subscription.routes.js";
import paymentRoutes from "./modules/payments/payment.routes.js";
import adminRoutes from "./modules/admin/admin.routes.js";
import auditLogRoutes from "./modules/audit/audit-log.routes.js";
import moderationRoutes from "./modules/admin/moderation.routes.js";
import settingsRoutes from "./modules/settings/site-settings.routes.js";
import publicSettingsRoutes from "./modules/settings/public-settings.routes.js";
import analyticsRoutes from "./modules/analytics/admin-analytics.routes.js";
import messageActionRoutes from "./modules/message-actions/message-actions.routes.js";
import groupRoutes from "./modules/groups/groups.routes.js";
import publicGroupRoutes from "./modules/groups/public-groups.routes.js";
import roomFeatureRoutes from "./modules/room-features/room-features.routes.js";
import mediaRoutes from "./modules/media/media.routes.js";
import contactsRoutes from "./modules/contacts/contacts.routes.js";
import statusRoutes from "./modules/status/status.routes.js";
import communitiesRoutes from "./modules/communities/communities.routes.js";
import guestRoutes from "./modules/guest/guest.routes.js";



const router = Router();

router.use("/auth", authRoutes);
router.use("/users", usersRoutes);
router.use("/roles", rolesRoutes);
router.use("/rooms", roomsRoutes);

router.use(
  "/notifications",
  notificationRouter
);
router.use(
  "/subscriptions",
  subscriptionRoutes
);
router.use(
  "/payments",
  paymentRoutes
);


router.use(
  "/admin",
  adminRoutes
);
router.use(
  "/admin/audit-logs",
  auditLogRoutes
);


router.use("/admin", moderationRoutes);
router.use("/settings", publicSettingsRoutes);
router.use("/admin/settings", settingsRoutes);
router.use("/admin/analytics", analyticsRoutes);
router.use("/messages", messageActionRoutes);
router.use("/public/groups", publicGroupRoutes);
router.use("/groups", groupRoutes);
router.use("/rooms/features", roomFeatureRoutes);
router.use("/media", mediaRoutes);
router.use("/contacts", contactsRoutes);
router.use("/status", statusRoutes);
router.use("/communities", communitiesRoutes);
router.use("/guest", guestRoutes);

// Keep "/" routes LAST

router.use("/", messagesRoutes);

export default router;

