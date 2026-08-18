import { Router } from "express";

import {
  createMessage,
  getMessages,
  updateMessage,
  deleteMessage,
  forwardMessage
} from "./messages.controller.js";

import {
  requireSubscriptionRead,
  requireSubscriptionSend,
} from "../subscriptions/subscription.middleware.js";

import { authenticate } from "../../core/middleware/auth.middleware.js";
import { requirePermission } from "../../core/middleware/permission.middleware.js";

const router = Router();

router.post( "/rooms/:roomId/messages", 
  authenticate, 
  requirePermission("messages.create"), 
  requireSubscriptionSend, 
  createMessage );
router.get( "/rooms/:roomId/messages",
   authenticate, 
   requirePermission("messages.read"), 
   requireSubscriptionRead,
   getMessages );

router.post(
  "/messages/:id/forward",
  authenticate,
  requirePermission("messages.create"),
  requireSubscriptionSend,
  forwardMessage
);

router.patch(
  "/messages/:id",
  authenticate,
  requirePermission("messages.update"),
  updateMessage
);

router.delete(
  "/messages/:id",
  authenticate,
  requirePermission("messages.delete"),
  deleteMessage
);

export default router;
