import { Router } from "express";

import {
  getRooms,
  getRoom,
  createRoom,
  createDirectRoom,
  updateRoom,
  deleteRoom,
  leaveRoom,
  addMember,
  removeMember
} from "./rooms.controller.js";

import {
  authenticate
} from "../../core/middleware/auth.middleware.js";

import {
  requirePermission
} from "../../core/middleware/permission.middleware.js";

const router = Router();

router.use(authenticate);

/*
 * Get rooms
 */
router.get(
  "/",
  requirePermission("rooms.read"),
  getRooms
);

/*
 * Create a direct conversation.
 *
 * POST /api/v1/rooms/direct
 * body:
 * {
 *   "userId": "TARGET-USER-UUID"
 * }
 */
router.post(
  "/direct",
  requirePermission("rooms.create"),
  createDirectRoom
);

/*
 * Create a generic room/group.
 */
router.post(
  "/",
  requirePermission("rooms.create"),
  createRoom
);

/*
 * Get one room.
 */
router.get(
  "/:id",
  requirePermission("rooms.read"),
  getRoom
);

/*
 * Update room.
 */
router.patch(
  "/:id",
  requirePermission("rooms.update"),
  updateRoom
);

/*
 * Delete room.
 */
router.post(
  "/:id/leave",
  requirePermission("rooms.read"),
  leaveRoom
);

router.delete(
  "/:id",
  requirePermission("rooms.delete"),
  deleteRoom
);

/*
 * Add member.
 */
router.post(
  "/:id/members",
  requirePermission("rooms.update"),
  addMember
);

/*
 * Remove member.
 */
router.delete(
  "/:id/members/:userId",
  requirePermission("rooms.update"),
  removeMember
);

export default router;